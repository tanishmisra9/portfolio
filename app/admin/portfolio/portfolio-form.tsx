"use client";

import { useState, useTransition } from "react";
import type { PortfolioContent } from "@/types/content";
import { ArrayEditor } from "@/components/admin/array-editor";
import { updatePortfolio } from "@/lib/admin/actions";

const inputClass =
  "w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export function PortfolioForm({ initial }: { initial: PortfolioContent }) {
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updatePortfolio(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="space-y-3">
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
        <label className="block">
          <span className="mb-1 block text-xs text-dim">About bio</span>
          <textarea
            className={inputClass}
            rows={4}
            value={data.aboutBio}
            onChange={(e) => setData({ ...data, aboutBio: e.target.value })}
          />
        </label>
      </section>

      <Section title="Experience">
        <ArrayEditor
          items={data.experience as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, experience: v as unknown as PortfolioContent["experience"] })}
          newItem={() => ({ id: crypto.randomUUID(), org: "", role: "", date: "", tags: [] })}
          fields={[
            { key: "org", label: "Organization", type: "text" },
            { key: "role", label: "Role", type: "text" },
            { key: "date", label: "Date", type: "text" },
            { key: "tags", label: "Tags", type: "tags" },
            { key: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Section>

      <Section title="Education">
        <ArrayEditor
          items={data.education as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, education: v as unknown as PortfolioContent["education"] })}
          newItem={() => ({ id: crypto.randomUUID(), institution: "", credential: "", date: "" })}
          fields={[
            { key: "institution", label: "Institution", type: "text" },
            { key: "credential", label: "Credential", type: "text" },
            { key: "date", label: "Date", type: "text" },
            { key: "pillRows", label: "Pill rows", type: "json" },
          ]}
        />
      </Section>

      <Section title="Skills">
        <ArrayEditor
          items={data.skills as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, skills: v as unknown as PortfolioContent["skills"] })}
          newItem={() => ({ id: crypto.randomUUID(), category: "", items: [] })}
          fields={[
            { key: "category", label: "Category", type: "text" },
            { key: "items", label: "Items", type: "tags" },
          ]}
        />
      </Section>

      <Section title="Certifications">
        <ArrayEditor
          items={data.certifications as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, certifications: v as unknown as PortfolioContent["certifications"] })}
          newItem={() => ({ id: crypto.randomUUID(), issuer: "", title: "" })}
          fields={[
            { key: "issuer", label: "Issuer (aria-label only)", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "credentialUrl", label: "Credential URL", type: "text" },
            { key: "pills", label: "Pills", type: "tags" },
            { key: "skills", label: "Skills", type: "tags" },
            { key: "courses", label: "Courses", type: "json" },
          ]}
        />
      </Section>

      <Section title="Projects">
        <ArrayEditor
          items={data.projects as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, projects: v as unknown as PortfolioContent["projects"] })}
          newItem={() => ({ id: crypto.randomUUID(), title: "", description: "", techStack: [], githubUrl: "" })}
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "techStack", label: "Tech stack", type: "tags" },
            { key: "githubUrl", label: "GitHub URL", type: "text" },
            { key: "pills", label: "Pills", type: "tags" },
            { key: "links", label: "Links", type: "json" },
          ]}
        />
      </Section>

      <Section title="Social">
        <ArrayEditor
          items={data.social as unknown as Record<string, unknown>[]}
          onChange={(v) => setData({ ...data, social: v as unknown as PortfolioContent["social"] })}
          newItem={() => ({ label: "", href: "", display: "" })}
          fields={[
            { key: "label", label: "Label", type: "text" },
            { key: "href", label: "URL", type: "text" },
            { key: "display", label: "Display text", type: "text" },
          ]}
        />
      </Section>

      <div className="fixed bottom-0 left-48 right-0 border-t border-fg/10 bg-bg p-4">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-sm text-dim">{title}</h2>
      {children}
    </section>
  );
}
