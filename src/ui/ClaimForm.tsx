"use client";
import { useState } from "react";

const QUESTIONS = [
  "Why did you choose medicine?",
  "What is your philosophy of care?",
  "How do you like to communicate with patients?",
  "Lived experience you choose to share (optional)",
  "What do you do outside medicine?",
];

/** Writes nothing yet: the claim flow lands with the register agreement. */
export function ClaimForm({ name }: { name: string }) {
  const [sent, setSent] = useState(false);
  if (sent) {
    return <p className="rise text-sm">Thanks. Nothing is stored yet; claims open once the register check is in place.</p>;
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>Ahpra registration number</span>
        <input name="ahpra" required pattern="MED\d{10}" placeholder="MED0001234567" className="min-h-11 rounded-card border border-line bg-white px-3 text-base outline-none focus:border-foliage" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Email at your practice domain</span>
        <input name="email" type="email" required className="min-h-11 rounded-card border border-line bg-white px-3 text-base outline-none focus:border-foliage" />
      </label>
      <details className="rounded-card border border-line bg-mist/60 p-3 text-sm">
        <summary className="min-h-11 leading-[44px]">What we will ask {name}</summary>
        <ol className="list-decimal pl-5">
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className="mt-2 text-ink-soft">Shown only with your approval. Edit or remove it any time.</p>
      </details>
      <button type="submit" className="min-h-12 rounded-full bg-foliage px-6 text-base font-medium text-paper">Claim</button>
    </form>
  );
}
