// Public assets (public/figma/**) by absolute path. next/link and the router prefix the
// basePath themselves; a plain <img src> does not, so the static build (basePath
// /Wattle-Health) sets NEXT_PUBLIC_BASE_PATH and every asset url goes through here.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
