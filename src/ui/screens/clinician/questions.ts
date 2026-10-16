// The eight interview questions (C04–C06). A plain module, no "use client": the server pages
// app/join/interview/[n] and app/join/draft/[n] read TOTAL for their params and bounds, and a
// client module's exports would reach them as references, not values.
import type { ProfileText } from "@/src/server/clinician";

export type ShareKey = "lived" | "outside" | "books" | "why";

export const QUESTIONS: { n: number; text: string; field: keyof ProfileText; lead: string; share?: ShareKey }[] = [
  { n: 1, text: "What are your clinical interests?", field: "clinical_interests", lead: "has clinical interests in" },
  { n: 2, text: "How do you approach a first appointment?", field: "communication_approach", lead: "starts a first appointment with" },
  { n: 3, text: "Which patients do you most enjoy helping?", field: "enjoys_serving", lead: "most enjoys helping" },
  { n: 4, text: "Why did you choose medicine?", field: "why_medicine", lead: "chose medicine because of", share: "why" },
  { n: 5, text: "What is your professional purpose?", field: "professional_purpose", lead: "sees their purpose as" },
  { n: 6, text: "Any lived experience you choose to share?", field: "lived_experience", lead: "shares lived experience of", share: "lived" },
  { n: 7, text: "Outside medicine, what do you enjoy?", field: "outside_medicine", lead: "enjoys", share: "outside" },
  { n: 8, text: "A favourite book, film or podcast, and why?", field: "favourite_book", lead: "recommends", share: "books" },
];
export const TOTAL = QUESTIONS.length;
