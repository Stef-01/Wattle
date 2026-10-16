// Doctor ids look like "psychiatry:abdul-burhan". The colon is legal in a URL but not in a file
// name on Windows, and a static export writes one folder per id, so every link and every
// generateStaticParams goes through this one mapping: ":" ⇄ "~". Older links with "%3A" still
// resolve because the page decodes both forms.

export function doctorSlug(id: string): string {
  return id.replace(/:/g, "~");
}

export function doctorIdFromParam(param: string): string {
  return decodeURIComponent(param).replace(/~/g, ":");
}

/** "/doctor/<slug>", "/doctor/<slug>/expertise", ... */
export function doctorHref(id: string, sub?: "expertise" | "why"): string {
  return `/doctor/${doctorSlug(id)}${sub ? `/${sub}` : ""}`;
}
