"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { quotes } from "@/db/schema";
import { createQuote, deleteQuote, updateQuote } from "@/lib/admin/actions";

type Quote = InferSelectModel<typeof quotes>;
type Size = 1 | 2 | 3;

const SIZES: { value: Size; label: string }[] = [
  { value: 1, label: "Standard" },
  { value: 2, label: "Large" },
  { value: 3, label: "Featured" },
];

const fieldClass =
  "w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

function SizePicker({ value, onChange }: { value: Size; onChange: (v: Size) => void }) {
  return (
    <div role="radiogroup" aria-label="Size on the Quotes page" className="inline-flex rounded border border-border-strong p-0.5">
      {SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          role="radio"
          aria-checked={value === s.value}
          onClick={() => onChange(s.value)}
          className={`min-h-9 rounded px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 ${
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [size, setSize] = useState<Size>((quote.emphasis as Size) ?? 1);
  const [saved, setSaved] = useState(false);

  function save(fields: Parameters<typeof updateQuote>[1]) {
    startTransition(async () => {
      await updateQuote(quote.id, fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-4 backdrop-blur-md">
      <textarea
        aria-label="Quote text"
        rows={2}
        className={`${fieldClass} text-lg`}
        defaultValue={quote.text}
        onBlur={(e) => e.target.value !== quote.text && save({ text: e.target.value })}
      />
      <div className="flex flex-wrap items-end gap-4">
        <label className="block min-w-48 flex-1">
          <span className="mb-1 block text-base text-dim">Attribution</span>
          <input
            className={fieldClass}
            defaultValue={quote.attribution ?? ""}
            onBlur={(e) =>
              e.target.value !== (quote.attribution ?? "") && save({ attribution: e.target.value || null })
            }
          />
        </label>
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
        <span aria-live="polite" className="min-w-14 pb-2 text-base text-dim">
          {saved ? "Saved ✓" : ""}
        </span>
        <button
          type="button"
          aria-label="Delete quote"
          onClick={() => {
            if (!confirm("Delete this quote?")) return;
            startTransition(async () => {
              await deleteQuote(quote.id);
              router.refresh();
            });
          }}
          className="-m-1 rounded p-3 text-muted transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function QuotesManager({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
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
        <span className="mb-1 block text-base text-dim">Filter by author</span>
        <select
          className="rounded border border-border-strong bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        >
          <option value="">All authors</option>
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3">
        {visibleQuotes.map((q) => (
          <QuoteRow key={q.id} quote={q} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await createQuote({ text, attribution: attribution || undefined, emphasis: size });
            setText("");
            setAttribution("");
            setSize(1);
            router.refresh();
          });
        }}
        className="space-y-4 rounded-md border border-border bg-surface p-4 backdrop-blur-md"
      >
        <h2 className="text-lg font-semibold text-fg">New quote</h2>
        <label className="block">
          <span className="mb-1 block text-base text-dim">Quote</span>
          <textarea
            className={fieldClass}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-base text-dim">Attribution</span>
          <input className={fieldClass} value={attribution} onChange={(e) => setAttribution(e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-base text-dim">Size</span>
          <SizePicker value={size} onChange={setSize} />
        </div>
        <button type="submit" className="rounded bg-fg px-4 py-2 text-base text-bg">
          + Add quote
        </button>
      </form>
    </div>
  );
}
