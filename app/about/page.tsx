import { rosterCounts } from "@/src/data/providers";

export const metadata = { title: "About · Wattle Health" };
export const revalidate = 3600;

export default async function AboutPage() {
  const counts = await rosterCounts();
  return (
    <section className="rise mx-auto flex max-w-xl flex-col gap-4 pt-6">
      <h1 className="text-3xl">About Wattle</h1>
      <p className="leading-relaxed">
        Wattle reads one sentence and lists Queensland doctors whose documented focus fits it, every fact badged with its source and date. We collect facts only, from directories we are permitted to use, never prose or photos, and never show ratings, testimonials or paid placement.
      </p>
      <p className="text-sm text-ink-soft">Listed today: {counts.total} doctors.</p>
    </section>
  );
}
