"use client";
// A result card (2026-10-16, after the Headway / Grow / Zocdoc benchmark): avatar, name, one
// specialty-and-place line, the matched chips, one quote in the doctor's own published words,
// then the practical line. The whole card opens the profile; the heart saves.
import Link from "next/link";
import type { Card } from "@/src/data/search-types";
import type { DoctorRecord } from "@/src/data/types";
import { doctorHref } from "@/src/data/doctor-slug";
import { Avatar, Check, Chip, Chips, Heart } from "@/src/ui/kit";
import { clip, drName, personalOf, practicalChips, quoteOf, specialtyTitle, yearsLine } from "@/src/ui/screens/patient-b/facts";
import { listedOnly, matchChips } from "./card";
import { placeLine, suburbOf } from "./lib";

function clinicalLine(card: Card, labels: Record<string, string>): string {
  if (listedOnly(card)) return `Listed under ${specialtyTitle(card.doctor.specialty).toLowerCase()}; no documented focus on this yet.`;
  const ids = card.doctor.conditions.value.slice(0, 3).map((id) => labels[id] ?? id.replace(/-/g, " "));
  return ids.length ? `Lists ${ids.map((l, i) => (i === 0 ? l : l.charAt(0).toLowerCase() + l.slice(1))).join(", ")}.` : "No clinical focus listed yet.";
}

export function DoctorCard({ card, labels, saved, onSave, index = 0 }: { card: Card; labels: Record<string, string>; saved: boolean; onSave: () => void; index?: number }) {
  const d: DoctorRecord = card.doctor;
  const name = drName(d);
  const near = card.distanceKm !== undefined && card.distanceKm <= 20;
  const place = near ? suburbOf(card) : placeLine(card);
  const km = card.distanceKm !== undefined ? `${Math.max(1, Math.round(card.distanceKm))} km` : d.telehealth.value === "only" ? "Telehealth" : null;
  const tail = [place, km].filter(Boolean).map((t) => ` · ${t}`).join("");
  const chips = matchChips(card);
  const quote = quoteOf(d);
  const practical = [yearsLine(d), ...practicalChips(d)].filter(Boolean) as string[];
  const personal = personalOf(d);

  return (
    <article className="rise relative rounded-[20px] border border-hairline bg-white p-4 pt-5" style={{ "--i": index } as React.CSSProperties}>
      <button
        type="button"
        aria-label={saved ? "Remove from saved" : "Save"}
        aria-pressed={saved}
        onClick={onSave}
        className={`press absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full ${saved ? "bg-accent-soft text-accent" : "bg-surface-soft text-grey"}`}
      >
        <Heart size={20} fill={saved ? "currentColor" : "none"} />
      </button>
      <Link href={doctorHref(d.id)} className="press press-soft block">
        <div className="flex items-center gap-4 pr-12">
          <Avatar name={name} size={56} />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="display line-clamp-2 text-[22px] leading-[1.15] tracking-[-0.01em] text-ink">{name}{d.synthetic ? " (example)" : ""}</h3>
            <p className="truncate text-[15px] text-charcoal">{specialtyTitle(d.specialty)}<span className="text-grey">{tail}</span></p>
          </div>
        </div>
        {chips.length > 0 ? (
          <Chips className="mt-4">
            {chips.map((c) => (
              <Chip key={c} tone="soft"><Check size={14} className="mr-1 text-accent" />{c}</Chip>
            ))}
          </Chips>
        ) : null}
        <p className="mt-3 text-[15px] leading-[1.45] text-charcoal">{quote ? `“${clip(quote.text, 110)}”` : clinicalLine(card, labels)}</p>
        {practical.length > 0 || (personal && personal.status === "illustrative") ? <p className="caption mt-2 text-[12px] text-grey">{[personal?.status === "illustrative" ? "Illustrative example" : null, ...practical].filter(Boolean).join(" · ")}</p> : null}
      </Link>
    </article>
  );
}
