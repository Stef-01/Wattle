// BUILD-TIME mapping of a doctor's free-text personal profile (philosophy, why medicine,
// purpose) to the closed `human_fit` labels of a discipline yaml. Written on 2026-10-15 for plan
// Task 6. Run by the enrichment pipeline / fixture authors, never in the request path: the
// matcher reads `personal.labels` and nothing else, so matching stays a lexical overlap of two
// closed sets.
//
// TWO CUE TABLES. The yaml's `human_fit` cues are PATIENT-phrased ("nobody listens") and are
// read here through the same lexicon so a doctor who writes "collaborative" or "evidence-based"
// lands on the label. The table below is DOCTOR-phrased ("I take time to listen"), authored
// here because the yaml is the patient's vocabulary. Every label it names must exist in the
// yaml; `labelPersonal` throws otherwise, so a typo is a build failure and never a silent miss.

import type { Discipline } from "@/src/disciplines/load";
import { phrasePresent, readHumanFit } from "./human-fit";
import type { Doctor, PersonalProfile } from "./types";

/** Doctor-side phrases → human_fit label id. Multi-word on purpose (see disciplines/mvp.yaml). */
export const DOCTOR_PHRASES: Readonly<Record<string, readonly string[]>> = {
  collaborative: ["shared decision", "shared decisions", "decisions are shared", "decide together", "work together", "work with you", "work alongside", "partnership with", "in partnership", "your goals", "you are the expert", "you know your body"],
  listens: ["take time to listen", "time to listen", "listen first", "listen carefully", "listening", "take you seriously", "taken seriously", "believe you", "believe patients", "your experience is real", "never dismissed", "not dismissed", "you are not imagining"],
  "evidence-based": ["evidence based", "best available evidence", "current evidence", "guidelines", "what the research shows", "research informed", "research-informed"],
  holistic: ["whole person", "the whole person", "whole of life", "beyond the diagnosis", "more than a diagnosis", "mind and body", "biopsychosocial", "lifestyle", "sleep, movement", "not just the symptoms"],
  direct: ["straight answers", "plain language", "plain english", "honest conversations", "tell you honestly", "say it plainly", "frank"],
  gentle: ["at your pace", "without judgement", "without judgment", "no judgement", "gently", "unhurried", "never rushed", "safe space", "compassion"],
  "lived-experience": ["my own experience", "my own diagnosis", "live with", "lived experience", "been through", "from both sides", "as a patient myself"],
  "lgbtq-affirming": ["lgbtqia", "lgbtq", "gender affirming", "gender-affirming", "queer", "trans and gender diverse", "rainbow"],
  "culturally-safe": ["culturally safe", "cultural safety", "first nations", "aboriginal and torres strait", "culturally responsive", "your culture"],
  "neurodiversity-affirming": ["neurodiversity affirming", "neuroaffirming", "neurodivergent", "strengths based", "strengths-based", "not a deficit", "different, not disordered"],
  "research-active": ["my research", "our research", "clinical trials", "i publish", "published", "research program", "research programme", "academic", "university", "pubmed"],
  "long-appointments": ["longer appointments", "long appointments", "extended consultations", "longer consultations", "45 minute", "60 minute", "an hour", "enough time"],
  "trauma-informed": ["trauma informed", "trauma-informed", "trauma aware", "ask before", "explain before", "your consent", "consent at every step"],
};

/** The free-text fields the labeller reads, joined. Lived experience is presence-only and is NOT read. */
function freeText(profile: PersonalProfile): string {
  return [profile.philosophy, profile.philosophyOfCare, profile.whyMedicine, profile.purpose, profile.professionalPurpose, profile.communicationApproach]
    .filter((part): part is string => Boolean(part))
    .join(". ");
}

/**
 * The closed labels a profile's free text reaches, in yaml order. Deterministic and total: no
 * text yields no labels. Declared `communication` labels are validated and included, so the
 * result is the full label set Layer 2 should read.
 */
export function labelPersonal(profile: PersonalProfile, discipline: Discipline): string[] {
  const known = new Set(discipline.humanFit.map((group) => group.id));
  for (const label of Object.keys(DOCTOR_PHRASES)) {
    if (!known.has(label)) throw new Error(`personal-labels: "${label}" is not a human_fit id in disciplines/${discipline.slug}.yaml`);
  }
  for (const label of profile.communication ?? []) {
    if (!known.has(label)) throw new Error(`personal-labels: communication label "${label}" is not a human_fit id in disciplines/${discipline.slug}.yaml`);
  }
  const text = freeText(profile);
  const reached = new Set<string>(readHumanFit(text, discipline));
  for (const [label, phrases] of Object.entries(DOCTOR_PHRASES)) {
    if (reached.has(label)) continue;
    if (phrases.some((phrase) => phrasePresent(text, phrase))) reached.add(label);
  }
  for (const label of profile.communication ?? []) reached.add(label);
  return discipline.humanFit.map((group) => group.id).filter((id) => reached.has(id));
}

/** The doctor with `personal.labels` filled from their free text. Identity when there is no profile. */
export function withPersonalLabels(doctor: Doctor, discipline: Discipline): Doctor {
  if (!doctor.personal) return doctor;
  return { ...doctor, personal: { ...doctor.personal, labels: labelPersonal(doctor.personal, discipline) } };
}
