"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { PortfolioContent } from "@/types/content";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { ArrayEditor, type Item } from "@/components/admin/array-editor";
import { EntryList } from "@/components/admin/entry-list";
import { CollapsibleSection } from "@/components/admin/collapsible-section";
import { CertificationsEditor } from "@/components/admin/certifications-editor";
import { SocialEditor } from "@/components/admin/social-editor";
import { BioEditor } from "@/components/admin/bio-editor";
import { formatDateRange } from "@/lib/format-date-range";
import { updatePortfolio } from "@/lib/admin/actions";

const inputClass =
  "w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

const SECTION_KEYS = [
  "bio",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "social",
] as const;

export function PortfolioForm({ initial }: { initial: PortfolioContent }) {
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<Record<(typeof SECTION_KEYS)[number], boolean>>({
    bio: true,
    experience: true,
    education: false,
    skills: false,
    certifications: false,
    projects: false,
    social: false,
  });

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(initial), [data, initial]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function save() {
    startTransition(async () => {
      await updatePortfolio(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function setAll(nextOpen: boolean) {
    setOpen(Object.fromEntries(SECTION_KEYS.map((key) => [key, nextOpen])) as typeof open);
  }

  return (
    <div className="space-y-0 pb-24">
      <div className="mb-4 flex items-center gap-3">
        <h1 className={ADMIN_SECTION_HEADING_CLASSES}>Portfolio</h1>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setAll(true)} className="text-xs text-muted hover:text-fg">
            Expand all
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-xs text-muted hover:text-fg">
            Collapse all
          </button>
        </div>
      </div>

      <CollapsibleSection title="Bio" open={open.bio} onToggle={(v) => setOpen({ ...open, bio: v })}>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-dim">Name</span>
            <input
              className={inputClass}
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-dim">Hero subtitle</span>
            <input
              className={inputClass}
              value={data.heroSubtitle}
              onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
            />
          </label>
          <div>
            <span className="mb-1 block text-xs text-dim">About bio</span>
            <BioEditor value={data.aboutBio} onChange={(aboutBio) => setData({ ...data, aboutBio })} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Experience"
        open={open.experience}
        onToggle={(v) => setOpen({ ...open, experience: v })}
      >
        <EntryList
          items={data.experience as unknown as Item[]}
          onChange={(v) => setData({ ...data, experience: v as unknown as PortfolioContent["experience"] })}
          hasDateRange
          summary={(item) =>
            `${item.org || "Untitled"} — ${item.role || "—"} — ${formatDateRange({
              startDate: (item.startDate as string) || "",
              endDate: (item.endDate as string | "present" | null) ?? null,
            })}`
          }
          newItem={() => ({
            id: crypto.randomUUID(),
            org: "",
            role: "",
            startDate: "",
            endDate: "present",
            tags: [],
          })}
          fields={[
            { key: "org", label: "Organization", type: "text" },
            { key: "role", label: "Role", type: "text" },
            { key: "tags", label: "Tags", type: "tags" },
            { key: "description", label: "Description", type: "textarea" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Education"
        open={open.education}
        onToggle={(v) => setOpen({ ...open, education: v })}
      >
        <EntryList
          items={data.education as unknown as Item[]}
          onChange={(v) => setData({ ...data, education: v as unknown as PortfolioContent["education"] })}
          hasDateRange
          summary={(item) =>
            `${item.institution || "Untitled"} — ${item.credential || "—"} — ${formatDateRange({
              startDate: (item.startDate as string) || "",
              endDate: (item.endDate as string | "present" | null) ?? null,
            })}`
          }
          newItem={() => ({
            id: crypto.randomUUID(),
            institution: "",
            credential: "",
            startDate: "",
            endDate: null,
          })}
          fields={[
            { key: "institution", label: "Institution", type: "text" },
            { key: "credential", label: "Credential", type: "text" },
            { key: "activities", label: "Activities & clubs", type: "tags" },
            { key: "coursework", label: "Coursework", type: "tags" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Skills" open={open.skills} onToggle={(v) => setOpen({ ...open, skills: v })}>
        <ArrayEditor
          layout="cards"
          items={data.skills as unknown as Item[]}
          onChange={(v) => setData({ ...data, skills: v as unknown as PortfolioContent["skills"] })}
          newItem={() => ({ id: crypto.randomUUID(), category: "", items: [] })}
          fields={[
            { key: "category", label: "Category", type: "text" },
            { key: "items", label: "Items", type: "tags" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Certifications"
        open={open.certifications}
        onToggle={(v) => setOpen({ ...open, certifications: v })}
      >
        <CertificationsEditor
          items={data.certifications as unknown as Item[]}
          onChange={(v) => setData({ ...data, certifications: v as unknown as PortfolioContent["certifications"] })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Projects"
        open={open.projects}
        onToggle={(v) => setOpen({ ...open, projects: v })}
      >
        <ArrayEditor
          layout="cards"
          items={data.projects as unknown as Item[]}
          onChange={(v) => setData({ ...data, projects: v as unknown as PortfolioContent["projects"] })}
          newItem={() => ({
            id: crypto.randomUUID(),
            title: "",
            description: "",
            techStack: [],
            githubUrl: "",
          })}
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "techStack", label: "Tech stack", type: "tags" },
            { key: "githubUrl", label: "GitHub URL", type: "text" },
            { key: "pills", label: "Pills", type: "tags" },
            {
              key: "links",
              label: "Links",
              type: "sublist",
              subFields: [
                { key: "label", label: "Label", type: "text" },
                { key: "url", label: "URL", type: "text" },
                {
                  key: "icon",
                  label: "Icon",
                  type: "select",
                  options: [
                    { value: "", label: "None" },
                    { value: "external", label: "External" },
                    { value: "newspaper", label: "Newspaper" },
                  ],
                },
              ],
              newSubItem: () => ({ id: crypto.randomUUID(), label: "", url: "" }),
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Social" open={open.social} onToggle={(v) => setOpen({ ...open, social: v })}>
        <SocialEditor
          items={data.social}
          onChange={(social) => setData({ ...data, social })}
        />
      </CollapsibleSection>

      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t border-fg/10 bg-bg p-4">
        {dirty && <span className="text-xs text-dim">Unsaved changes</span>}
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded bg-fg px-4 py-1.5 text-sm text-bg disabled:opacity-50"
        >
          {pending ? "Saving..." : saved ? "Saved ✓" : "Save draft"}
        </button>
      </div>
    </div>
  );
}
