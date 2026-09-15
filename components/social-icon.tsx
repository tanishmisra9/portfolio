import { FileDown, Github, Globe, Link as LinkIcon, Linkedin, Mail } from "lucide-react";
import type { SocialLink } from "@/types/content";

const ICONS = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  resume: FileDown,
  link: LinkIcon,
  globe: Globe,
} as const;

export const ICON_OPTIONS = Object.keys(ICONS) as (keyof typeof ICONS)[];

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

/** Prefers a manually-chosen icon; falls back to label-matching for entries that don't set one. */
export function resolveIcon(item: Pick<SocialLink, "label" | "icon">) {
  if (item.icon && item.icon in ICONS) return ICONS[item.icon as keyof typeof ICONS];
  return iconFor(item.label);
}
