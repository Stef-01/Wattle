// The [id] params the three doctor pages prerender: the first 40 roster ids as a warm cache.
import { doctorSlug } from "@/src/data/doctor-slug";
import { getDoctors } from "@/src/data/providers";

export async function doctorParams(): Promise<Array<{ id: string }>> {
  const doctors = await getDoctors();
  return doctors.slice(0, 40).map((d) => ({ id: doctorSlug(d.id) }));
}
