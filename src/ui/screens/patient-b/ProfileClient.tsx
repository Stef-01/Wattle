"use client";
// Interactive parts of P06/P11: the bookmark circle (wattle.saved.v1) and the "Contact practice"
// handoff sheet. The sheet shows the practice phone and website as the source listed them; it
// never shows an appointment time.
import { useEffect, useState } from "react";
import type { DoctorRecord } from "@/src/data/types";
import { Circle, Cta, FigmaIcon, Sheet } from "@/src/ui/kit";
import { isSavedId, toggleSavedId } from "@/src/ui/store";
import { contactOf, drShort } from "./facts";

export function BookmarkCircle({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(isSavedId(id)), [id]);
  return (
    <Circle over label={saved ? "Remove bookmark" : "Bookmark"} onClick={() => setSaved(toggleSavedId(id).includes(id))} className={saved ? "ring-2 ring-white/80" : undefined}>
      <FigmaIcon name="bookmark" size={22} />
    </Circle>
  );
}

export function ContactCta({ doctor, label }: { doctor: DoctorRecord; label: string }) {
  const [open, setOpen] = useState(false);
  const c = contactOf(doctor);
  const tel = c.phone ? `tel:${c.phone.replace(/[^\d+]/g, "")}` : null;
  return (
    <>
      <Cta onClick={() => setOpen(true)}>{label}</Cta>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Contact ${drShort(doctor)}`}>
        {c.room ? <p className="text-[14px] text-grey">{c.room}</p> : null}
        {tel ? (
          <a href={tel} className="flex h-[54px] items-center justify-center rounded-pill bg-charcoal text-[16px] font-medium text-white">
            Call {c.phone}
          </a>
        ) : null}
        {c.website ? (
          <a href={c.website} target="_blank" rel="noreferrer" className="flex h-[54px] items-center justify-center rounded-pill bg-surface-soft text-[16px] font-medium text-grey">
            Practice website
          </a>
        ) : null}
        {!tel && !c.website ? <p className="text-[16px] font-medium text-grey">No phone or website listed yet.</p> : null}
      </Sheet>
    </>
  );
}
