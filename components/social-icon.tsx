import { FileDown, Github, Linkedin, Mail } from "lucide-react";

/** Shared between the public social links and the admin editor's live icon preview, so a renamed label can't silently fall back to Mail without the owner noticing. */
export function iconFor(label: string) {
  const key = label.toLowerCase();
  if (key.includes("github")) return Github;
  if (key.includes("linkedin")) return Linkedin;
  if (key.includes("email")) return Mail;
  if (key.includes("resume")) return FileDown;
  if (process.env.NODE_ENV === "development") {
    console.warn(`[iconFor] Unrecognized social label: "${label}". Falling back to Mail icon.`);
  }
  return Mail;
}
