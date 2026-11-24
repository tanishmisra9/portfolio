"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortfolioContent } from "@/types/content";
import { Field, Input } from "@/components/admin/ui/field";
import { StickyBar } from "@/components/admin/ui/sticky-bar";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { ArrayEditor, type Item } from "@/components/admin/array-editor";
import { EntryList } from "@/components/admin/entry-list";
import { CertificationsEditor } from "@/components/admin/certifications-editor";
import { SocialEditor } from "@/components/admin/social-editor";
import { BioEditor } from "@/components/admin/bio-editor";
import { useRegisterDirty } from "@/components/admin/dirty-context";
import { updatePortfolioSection } from "@/lib/admin/actions";
import {
  findPortfolioSection,
  type PortfolioSectionSlug,
} from "@/lib/admin/portfolio-sections";

/**
 * One portfolio block per page. `data` is the whole draft so the editors keep their typed setData({ ...data, x }) shape,
 * but only this block's columns are compared for dirtiness and saved (updatePortfolioSection).
 */
export function PortfolioSectionForm({
  section,
  initial,
}: {
  section: PortfolioSectionSlug;
  initial: PortfolioContent;
}) {
  const keys = findPortfolioSection(section)!
    .keys as readonly (keyof PortfolioContent)[];
  const pick = (d: PortfolioContent) => JSON.stringify(keys.map((k) => d[k]));
  const [data, setData] = useState(initial);
  // The baseline for the dirty check: starts as the server-loaded value, then moves to whatever was last saved so
  // "Unsaved changes" doesn't stay stuck on after a save (the `initial` prop never updates without a reload).
  const [baseline, setBaseline] = useState(initial);
  const status = useSaveStatus();

  const dirty = useMemo(() => pick(data) !== pick(baseline), [data, baseline]); // eslint-disable-line react-hooks/exhaustive-deps
  useRegisterDirty(dirty);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function save() {
    void (async () => {
      const patch = Object.fromEntries(
        keys.map((k) => [k, data[k]]),
      ) as Partial<PortfolioContent>;
      const result = await status.run(() =>
        updatePortfolioSection(section, patch),
      );
      if (result.ok) setBaseline(data);
    })();
  }

  return (
    <div>
      {
        {
          bio: (
            <>
              <div className="space-y-3">
                {(["Line 1", "Line 2"] as const).map((label, index) => {
                  const lines = data.heroSubtitle.split("\n");
                  return (
                    <Field
                      key={label}
                      label={`Hero subtitle, ${label.toLowerCase()}`}
                    >
                      <Input
                        value={lines[index] ?? ""}
                        onChange={(e) => {
                          const next = [lines[0] ?? "", lines[1] ?? ""];
                          next[index] = e.target.value;
                          setData({
                            ...data,
                            heroSubtitle: next
                              .filter((l, i) => i === 0 || l)
                              .join("\n"),
                          });
                        }}
                      />
                    </Field>
                  );
                })}
                <div>
                  <span className="mb-1 block text-base text-dim">
                    About bio
                  </span>
                  <BioEditor
                    value={data.aboutBio}
                    onChange={(aboutBio) => setData({ ...data, aboutBio })}
                  />
                </div>
              </div>
            </>
          ),
          experience: (
            <>
              <EntryList
                items={data.experience as unknown as Item[]}
                onChange={(v) =>
                  setData({
                    ...data,
                    experience: v as unknown as PortfolioContent["experience"],
                  })
                }
                hasDateRange
                summary={(item) => (item.org as string) || "Untitled"}
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
                  {
                    key: "description",
                    label: "Description",
                    type: "textarea",
                  },
                ]}
              />
            </>
          ),
          education: (
            <>
              <EntryList
                items={data.education as unknown as Item[]}
                onChange={(v) =>
                  setData({
                    ...data,
                    education: v as unknown as PortfolioContent["education"],
                  })
                }
                hasDateRange
                summary={(item) => (item.credential as string) || "Untitled"}
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
                  {
                    key: "activities",
                    label: "Activities & clubs",
                    type: "tags",
                  },
                  { key: "coursework", label: "Coursework", type: "tags" },
                ]}
              />
            </>
          ),
          skills: (
            <>
              <ArrayEditor
                layout="cards"
                cardLabel={(item) => item.category as string}
                items={data.skills as unknown as Item[]}
                onChange={(v) =>
                  setData({
                    ...data,
                    skills: v as unknown as PortfolioContent["skills"],
                  })
                }
                newItem={() => ({
                  id: crypto.randomUUID(),
                  category: "",
                  items: [],
                })}
                fields={[
                  { key: "category", label: "Category", type: "text" },
                  { key: "items", label: "Items", type: "tags" },
                ]}
              />
            </>
          ),
          certifications: (
            <>
              <CertificationsEditor
                items={data.certifications as unknown as Item[]}
                onChange={(v) =>
                  setData({
                    ...data,
                    certifications:
                      v as unknown as PortfolioContent["certifications"],
                  })
                }
              />
            </>
          ),
          projects: (
            <>
              <ArrayEditor
                layout="cards"
                cardLabel={(item) => item.title as string}
                hideToggle
                reorderable
                items={data.projects as unknown as Item[]}
                onChange={(v) =>
                  setData({
                    ...data,
                    projects: v as unknown as PortfolioContent["projects"],
                  })
                }
                newItem={() => ({
                  id: crypto.randomUUID(),
                  title: "",
                  description: "",
                  techStack: [],
                  githubUrl: "",
                })}
                fields={[
                  { key: "title", label: "Title", type: "text" },
                  {
                    key: "description",
                    label: "Description",
                    type: "textarea",
                  },
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
                    newSubItem: () => ({
                      id: crypto.randomUUID(),
                      label: "",
                      url: "",
                    }),
                  },
                ]}
              />
            </>
          ),
          social: (
            <>
              <SocialEditor
                items={data.social}
                onChange={(social) => setData({ ...data, social })}
              />
            </>
          ),
        }[section]
      }
      <StickyBar dirty={dirty} onSave={save} state={status} />
    </div>
  );
}
