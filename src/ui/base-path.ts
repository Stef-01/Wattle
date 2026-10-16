// Public assets (public/figma/**) by absolute path; one place to add a basePath if ever needed.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
