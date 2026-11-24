"use client";

import { useMemo, useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import type { quotes } from "@/db/schema";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/field";
import { EmptyState, Panel } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { createQuote, deleteQuote, updateQuote, updateQuotesSubtitle } from "@/lib/admin/actions";

type Quote = InferSelectModel<typeof quotes>;
type Size = 1 | 2 | 3;

const SIZES: { value: Size; label: string }[] = [
  { value: 1, label: "Standard" },
  { value: 2, label: "Large" },
  { value: 3, label: "Featured" },
];

function SizePicker({ value, onChange }: { value: Size; onChange: (v: Size) => void }) {
  return (
    <div role="radiogroup" aria-label="Size on the Quotes page" className="inline-flex border border-border-strong p-0.5">
      {SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          role="radio"
          aria-checked={value === s.value}
          onClick={() => onChange(s.value)}
          className={`min-h-9 px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
            value === s.value ? "bg-fg text-bg" : "text-muted hover:text-fg"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function QuoteRow({ quote }: { quote: Quote }) {
  const status = useSaveStatus();
  const [size, setSize] = useState<Size>((quote.emphasis as Size) ?? 1);

  function save(fields: Parameters<typeof updateQuote>[1]) {
    void status.run(() => updateQuote(quote.id, fields));
  }

  return (
    <Panel className="space-y-3 !p-4">
      <Textarea
        aria-label="Quote text"
        rows={2}
        className="text-lg"
        defaultValue={quote.text}
        onBlur={(e) => e.target.value !== quote.text && save({ text: e.target.value })}
      />
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Attribution" className="min-w-48 flex-1">
          <Input
            defaultValue={quote.attribution ?? ""}
            onBlur={(e) => e.target.value !== (quote.attribution ?? "") && save({ attribution: e.target.value || null })}
          />
        </Field>
        <div>
          <span className="mb-1 block text-base text-dim">Size</span>
          <SizePicker
            value={size}
            onChange={(v) => {
              setSize(v);
              save({ emphasis: v });
            }}
          />
        </div>
        <SaveStatus state={status} className="min-w-14 pb-2" />
        <DeleteButton label="Delete quote" onConfirm={() => void status.run(() => deleteQuote(quote.id))} />
      </div>
    </Panel>
  );
}

export function QuotesManager({ quotes, subtitle }: { quotes: Quote[]; subtitle: string }) {
  const subtitleStatus = useSaveStatus();
  const createStatus = useSaveStatus();
  const [text, setText] = useState("");
  const [attribution, setAttribution] = useState("");
  const [size, setSize] = useState<Size>(1);
  const [authorFilter, setAuthorFilter] = useState("");

  const authors = useMemo(
    () => Array.from(new Set(quotes.map((q) => q.attribution).filter((a): a is string => !!a))).sort(),
    [quotes],
  );
  const visibleQuotes = authorFilter ? quotes.filter((q) => q.attribution === authorFilter) : quotes;

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-base text-dim">
          Page subtitle <SaveStatus state={subtitleStatus} className="ml-2" />
        </span>
        <div className="flex items-center gap-2 border border-border-strong px-3 py-2 text-base focus-within:ring-2 focus-within:ring-fg/70">
          <span aria-hidden className="text-muted">&ldquo;</span>
          <input
            className="min-w-[8ch] max-w-full bg-transparent outline-none [field-sizing:content]"
            defaultValue={subtitle}
            onBlur={(e) => {
              if (e.target.value === subtitle) return;
              void subtitleStatus.run(() => updateQuotesSubtitle(e.target.value));
            }}
          />
          <span aria-hidden className="text-muted">&rdquo;</span>
        </div>
      </label>

      <Field label="Filter by author">
        <Select className="!w-auto" value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>
          <option value="">All authors</option>
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </Select>
      </Field>

      <div className="space-y-3">
        {visibleQuotes.length === 0 && <EmptyState>{authorFilter ? "No quotes by this author." : "No quotes yet."}</EmptyState>}
        {visibleQuotes.map((q) => (
          <QuoteRow key={q.id} quote={q} />
        ))}
      </div>

      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const result = await createStatus.run(() => createQuote({ text, attribution: attribution || undefined, emphasis: size }));
              if (!result.ok) return;
              setText("");
              setAttribution("");
              setSize(1);
            })();
          }}
          className="space-y-4"
        >
          <h2 className="font-display text-xl/[1.4] font-bold text-fg">New Quote</h2>
          <Field label="Quote">
            <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} required />
          </Field>
          <Field label="Attribution">
            <Input value={attribution} onChange={(e) => setAttribution(e.target.value)} />
          </Field>
          <div>
            <span className="mb-1 block text-base text-dim">Size</span>
            <SizePicker value={size} onChange={setSize} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" pending={createStatus.status === "saving"}>
              Add quote
            </Button>
            <SaveStatus state={createStatus} />
          </div>
        </form>
      </Panel>
    </div>
  );
}
