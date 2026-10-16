// The in-memory backend of the clinician flow: one map per table, keyed by id, alive for the
// process (server) or the page (static build). Never persisted. No node imports, so the static
// build can run it in the browser; store.ts re-exports it for the server.

export type Row = Record<string, unknown>;

const memory = new Map<string, Map<string, Row>>();

function tableOf(name: string): Map<string, Row> {
  let t = memory.get(name);
  if (!t) {
    t = new Map();
    memory.set(name, t);
  }
  return t;
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function memInsert<T extends Row>(table: string, row: Row): T {
  const id = typeof row.id === "string" ? row.id : newId();
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
