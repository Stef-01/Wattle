"use client";
// Client pieces of the v3 profile: a chip list that shows five and folds the rest.
import { useState } from "react";
import { Chip, Chips } from "@/src/ui/kit";

export function ConditionChips({ items, show = 5 }: { items: string[]; show?: number }) {
  const [all, setAll] = useState(false);
  if (items.length === 0) return <p className="text-[15px] text-grey">No clinical focus listed yet.</p>;
  const shown = all ? items : items.slice(0, show);
  const rest = items.length - shown.length;
  return (
    <Chips>
      {shown.map((c) => (
        <Chip key={c}>{c}</Chip>
      ))}
      {rest > 0 ? (
        <button type="button" onClick={() => setAll(true)} className="press inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-accent">
          +{rest} more
        </button>
      ) : null}
    </Chips>
  );
}
