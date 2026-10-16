// "Tidy it with you" (C06): deterministic text cleanup, never a model call.
// tidy()        trims, drops fillers, joins fragments, sentence-cases, ends sentences.
// thirdPerson() turns "I ask..." into "Dr Reilly asks..." with a small verb table.
// The draft is labelled "Tidied, not rewritten" and the doctor can edit every word.

const FILLERS: [RegExp, string][] = [
  [/\b(um+|uh+|erm+|hmm+|ah+)\b[,.]?\s*/gi, ""],
  [/\b(you know|i mean|sort of|kind of|basically|literally|actually)\b,?\s*/gi, ""],
  [/,\s*like,\s*/gi, " "],
  [/^like,\s*/i, ""],
  [/^(so|well|okay|ok|right|yeah)[,.]?\s+/i, ""],
];

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// A comma followed by one of these words starts a new independent clause ("…options, most have
// been rushed before"). The comma becomes a full stop unless the sentence opened with a
// subordinator ("If they need time, I give it") or the first clause is too short to stand alone.
const CLAUSE_STARTERS = new Set([
  "i", "i'm", "i've", "i'd", "i'll", "we", "we're", "we've", "we'd", "we'll", "they", "they're", "he", "she", "it", "it's", "you",
  "most", "many", "some", "people", "patients", "that's", "there's", "this", "these", "those", "everyone", "nobody", "others",
]);
const SUBORDINATORS = /^(if|when|whenever|while|because|although|though|since|unless|before|after|once|as|until|where|whereas|even)\b/i;

function splitSplices(sentence: string): string {
  if (SUBORDINATORS.test(sentence)) return sentence;
  return sentence.replace(/, ([A-Za-z']+)(?=\s|$)/g, (m, next: string, offset: number) => {
    const before = sentence.slice(0, offset).trim();
    if (before.split(" ").length < 3 || !CLAUSE_STARTERS.has(next.toLowerCase())) return m;
    return `. ${next.charAt(0).toUpperCase()}${next.slice(1)}`;
  });
}

export function tidy(raw: string): string {
  // A line break after an unpunctuated fragment is a pause the speaker took: keep it as a comma
  // so the clause rule below can decide whether it was a list or a new sentence.
  let t = raw
    .replace(/\r/g, "")
    .replace(/([^.!?,;\s])[ \t]*\n+[ \t]*(?=\S)/g, "$1, ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [re, rep] of FILLERS) t = t.replace(re, rep);
  t = t
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/,{2,}/g, ",")
    .replace(/\.{2,}/g, ".")
    .replace(/,\s*([.!?]|$)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!t) return "";
  return sentences(t)
    .map((s) => {
      let x = s.replace(/^[,;\s]+/, "");
      x = x.charAt(0).toUpperCase() + x.slice(1);
      x = x.replace(/\bi\b/g, "I");
      x = splitSplices(x);
      if (!/[.!?]$/.test(x)) x += ".";
      return x;
    })
    .join(" ");
}

const IRREGULAR: Record<string, string> = { am: "is", have: "has", do: "does", go: "goes", "don't": "doesn't", "haven't": "hasn't", were: "was" };
const UNCHANGED = new Set(["can", "can't", "cannot", "will", "won't", "would", "wouldn't", "should", "shouldn't", "might", "may", "must", "could", "couldn't", "did", "didn't", "had", "hadn't", "was", "used"]);
const ADVERBS = new Set(["really", "always", "usually", "often", "never", "also", "generally", "mostly", "sometimes", "rarely", "just", "still", "very", "particularly", "especially", "mainly", "first", "then", "personally", "typically"]);

function conjugate(verb: string): string {
  const lower = verb.toLowerCase();
  if (IRREGULAR[lower]) return IRREGULAR[lower];
  if (UNCHANGED.has(lower)) return verb;
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${verb}es`;
  if (/[^aeiou]y$/.test(lower)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

// "I'm" → "Dr Reilly is" on the naming mention, "they're" after it.
const CONTRACTIONS: Record<string, [string, string]> = {
  "i'm": ["is", "'re"],
  "i've": ["has", "'ve"],
  "i'd": ["would", "'d"],
  "i'll": ["will", "'ll"],
};

// First-person plural and the object/possessive forms map straight to the plural third person;
// only "I" names the doctor, since "we" is usually the practice.
const PLURAL: Record<string, string> = {
  we: "they", "we're": "they're", "we've": "they've", "we'd": "they'd", "we'll": "they'll",
  us: "them", our: "their", ours: "theirs", ourselves: "themselves",
  my: "their", me: "them", mine: "theirs", myself: "themselves",
};

/** Rewrites "I" to the doctor's name in the first sentence that has one, then to "they". */
export function thirdPerson(text: string, drName: string): string {
  const name = drName.trim();
  let named = false;
  return sentences(text)
    .map((s) => {
      const words = s.split(" ");
      let changed = false;
      for (let i = 0; i < words.length; i++) {
        const w = words[i] ?? "";
        const bare = w.replace(/[^A-Za-z']/g, "");
        const trail = w.slice(bare.length);
        const lower = bare.toLowerCase();
        const useName = !named && !changed;
        const subject = useName ? name : i === 0 ? "They" : "they";
        if (CONTRACTIONS[lower]) {
          const [sing, plural] = CONTRACTIONS[lower];
          words[i] = useName ? `${subject} ${sing}${trail}` : `${subject}${plural}${trail}`;
          changed = true;
          continue;
        }
        if (bare !== "I") {
          const p = PLURAL[lower];
          if (p) words[i] = (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p) + trail;
          continue;
        }
        words[i] = subject + trail;
        changed = true;
        if (trail) continue; // "I," or "I." — no verb follows
        let j = i + 1;
        while (j < words.length && ADVERBS.has((words[j] ?? "").toLowerCase())) j++;
        const verb = words[j];
        if (useName && verb) {
          const vb = verb.replace(/[^A-Za-z']/g, "");
          const vt = verb.slice(vb.length);
          if (vb) words[j] = conjugate(vb) + vt;
        }
      }
      if (changed) named = true;
      const out = words.join(" ");
      return out.charAt(0).toUpperCase() + out.slice(1);
    })
    .join(" ");
}

/** The whole C06 draft: tidy, then third person; a per-question lead-in when the answer never says "I". */
export function draftFor(raw: string, drName: string, lead: string): string {
  const clean = tidy(raw);
  if (!clean) return "";
  if (/\bI\b|\bI'|\b(we|we're|we've|we'd|we'll|us|our|ours|my|me|mine|myself|ourselves)\b/i.test(clean)) return thirdPerson(clean, drName);
  const lower = clean.charAt(0).toLowerCase() + clean.slice(1);
  return `${drName} ${lead} ${lower}`;
}
