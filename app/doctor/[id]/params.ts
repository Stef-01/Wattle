// The [id] params the three doctor pages prerender: every roster id (slugged) in the static
// build, the first 40 as a warm cache on a server.
import { doctorSlug } from "@/src/data/doctor-slug";
import { getDoctors } from "@/src/data/providers";

export async function doctorParams(): Promise<Array<{ id: string }>> {
  const doctors = await getDoctors();
  const all = process.env.NEXT_PUBLIC_STATIC === "1";
  return (all ? doctors : doctors.slice(0, 40)).map((d) => ({ id: doctorSlug(d.id) }));
}
