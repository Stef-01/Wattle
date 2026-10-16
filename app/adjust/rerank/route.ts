// POST /adjust/rerank. Reranks the Layer-1 survivors of a request with the person's "what matters
// most" choices. Runs on the server because the discipline vocabulary is read from disk; the
// rerank itself is `rerank(survivors, intent, weights, discipline)` from src/matching, pure over
// the list it is given. Without survivors in the body the request is matched first (same call
// as /api/match) and the survivors returned so the next adjustment needs no search.
import { NextResponse } from "next/server";
import { match, rerank, shown, type HumanFitWeights } from "@/src/matching";
import type { Intent, Ranked } from "@/src/matching/types";
import { getDoctors, mvpDiscipline } from "@/src/data/providers";
import { resolveSuburb } from "@/src/data/places";
import type { Card, FitBand, SearchResponse } from "@/src/data/search-types";
import type { DoctorRecord } from "@/src/data/types";
import type { RerankBody, RerankOut } from "@/src/ui/screens/patient-b/rerank-client";

export const dynamic = "force-dynamic";

const BAND: Record<Ranked["clinicalFit"]["band"], FitBand> = { documented: "strong", plausible: "some", listed: "listed" };

function toCard(r: Ranked, byId: Map<string, DoctorRecord>): Card | null {
  const doctor = byId.get(r.doctor.id);
  if (!doctor) return null;
  const card: Card = {
    doctor,
    headline: r.headline,
    score: r.score,
    clinicalFit: { band: BAND[r.clinicalFit.band] ?? "listed", reasons: r.clinicalFit.reasons.map((x) => x.text) },
    humanFit: { score: r.humanFit.score, reasons: r.humanFit.reasons.map((x) => x.text), basis: r.humanFit.basis },
    evidence: r.evidence,
    missed: r.missed,
  };
  if (r.distanceKm !== undefined) card.distanceKm = r.distanceKm;
  return card;
}

export async function POST(request: Request): Promise<Response> {
  let body: RerankBody;
  try {
    body = (await request.json()) as RerankBody;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const doctors = await getDoctors();
  const discipline = mvpDiscipline();
  const byId = new Map(doctors.map((d) => [d.id, d]));

  let survivors: Ranked[] | undefined = Array.isArray(body.survivors) ? body.survivors : undefined;
  let intent: Intent | undefined = body.intent;
  let orderNote = "";
  let order: SearchResponse["order"] = "informed";
  let placeOut: SearchResponse["place"] = { typed: body.ask?.suburb ?? "", suburb: null };

  if (!survivors || !intent) {
    if (!body.ask || typeof body.ask.sentence !== "string" || !body.ask.sentence.trim()) {
      return NextResponse.json({ error: "ask or survivors required" }, { status: 400 });
    }
    const typed = (body.ask.suburb ?? "").trim();
    const place = typed ? resolveSuburb(typed, doctors) : null;
    const result = match(body.ask.sentence.slice(0, 1200), place, doctors, { discipline, weights: body.weights ?? {} });
    survivors = result.survivors;
    intent = result.intent ?? { conditions: [], constraints: {}, manner: [], urgency: "routine", referralInHand: false, refused: [] };
    orderNote = result.orderNote;
    order = result.order;
    placeOut = { typed, suburb: place?.suburb ?? null };
  }

  // Intent edits: extra human-fit labels, and the practical constraints.
  const edits = body.edits ?? {};
  const humanFit = [...new Set([...(intent.humanFit ?? []), ...(edits.humanFit ?? [])])];
  const constraints = { ...intent.constraints };
  if (edits.maxKm) constraints.maxKm = edits.maxKm;
  if (edits.telehealthOnly) constraints.telehealth = "only";
  if (edits.anyGender) delete constraints.gender;
  const edited: Intent = { ...intent, humanFit, constraints };

  // Practical filters on the survivors themselves (Layer 1 already ran; these only narrow).
  let kept = survivors;
  if (edits.maxKm) kept = kept.filter((r) => r.distanceKm === undefined || r.distanceKm <= edits.maxKm! || r.doctor.telehealth.value !== "none");
  if (edits.telehealthOnly) kept = kept.filter((r) => r.doctor.telehealth.value !== "none");

  const weights: Partial<HumanFitWeights> = body.weights ?? {};
  const reranked = rerank(kept, edited, weights, discipline);
  const cards = shown(reranked).map((r) => toCard(r, byId)).filter((c): c is Card => c !== null);

  const response: SearchResponse = {
    order: cards.length === 0 ? "unserved" : order,
    orderNote: cards.length === 0 ? "Nobody left after those choices. Loosen one to see doctors again." : orderNote || "Reordered by what matters most to you.",
    cards,
    chips: body.chips ?? [],
    clarifiers: [],
    place: placeOut,
    rosterSize: doctors.length,
  };
  const out: RerankOut = { response, survivors: reranked, intent: edited };
  return NextResponse.json(out);
}
