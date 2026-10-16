// Server-only persistence for the clinician flow. Two backends with one shape:
//   - Supabase REST (PostgREST) with SUPABASE_SERVICE_ROLE_KEY, when the env var is set;
//   - an in-memory map otherwise, so the UI runs locally and in CI without a key.
// No SDK: plain fetch, as src/data/providers.ts does for the published_* views.
// Imported only from "use server" modules (src/server/clinician.ts); never from client code.
import { randomUUID } from "node:crypto";

export type Backend = "supabase" | "memory";

export function backend(): Backend {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "memory";
}

type Row = Record<string, unknown>;

/* ------------------------------------------------------------- Supabase */

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role env is not set");
  return { url: url.replace(/\/$/, ""), key };
}

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { url, key } = env();
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new Error(`supabase ${init.method ?? "GET"} ${path.split("?")[0]}: ${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** `select` returns rows; filters are PostgREST query strings (already encoded). */
export async function select<T extends Row>(table: string, query: string): Promise<T[]> {
  return rest<T[]>(`${table}?${query}`);
}

export async function insert<T extends Row>(table: string, row: Row): Promise<T> {
  const rows = await rest<T[]>(table, { method: "POST", body: JSON.stringify(row), prefer: "return=representation" });
  const first = rows[0];
  if (!first) throw new Error(`insert into ${table} returned no row`);
  return first;
}

/** Upsert on a unique column set: `onConflict` is the comma-separated column list. */
export async function upsert<T extends Row>(table: string, row: Row, onConflict: string): Promise<T> {
  const rows = await rest<T[]>(`${table}?on_conflict=${onConflict}`, {
    method: "POST",
    body: JSON.stringify(row),
    prefer: "return=representation,resolution=merge-duplicates",
  });
  const first = rows[0];
  if (!first) throw new Error(`upsert into ${table} returned no row`);
  return first;
}

/* --------------------------------------------------------------- memory */

// One map per table, keyed by id. Lives for the server process; never persisted.
const memory = new Map<string, Map<string, Row>>();

function tableOf(name: string): Map<string, Row> {
  let t = memory.get(name);
  if (!t) {
    t = new Map();
    memory.set(name, t);
  }
  return t;
}

export function memInsert<T extends Row>(table: string, row: Row): T {
  const id = typeof row.id === "string" ? row.id : randomUUID();
  const full: Row = { id, created_at: new Date().toISOString(), ...row };
  tableOf(table).set(id, full);
  return full as unknown as T;
}

export function memFind<T extends Row>(table: string, pred: (r: Row) => boolean): T | undefined {
  for (const r of tableOf(table).values()) if (pred(r)) return r as T;
  return undefined;
}

export function memUpsert<T extends Row>(table: string, row: Row, keys: string[]): T {
  const existing = memFind(table, (r) => keys.every((k) => r[k] === row[k]));
  if (existing) {
    const merged = { ...existing, ...row };
    tableOf(table).set(String(existing.id), merged);
    return merged as T;
  }
  return memInsert<T>(table, row);
}

/** Row counts per table; the dev banner and tests read this. */
export function memSnapshot(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, t] of memory) out[name] = t.size;
  return out;
}
