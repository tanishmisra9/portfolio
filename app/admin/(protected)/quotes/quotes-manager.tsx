"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { quotes } from "@/db/schema";
import { createQuote, deleteQuote, updateQuote } from "@/lib/admin/actions";

type Quote = InferSelectModel<typeof quotes>;

export function QuotesManager({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [attribution, setAttribution] = useState("");
  const [emphasis, setEmphasis] = useState<1 | 2 | 3>(1);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {quotes.map((q) => (
          <div key={q.id} className="flex items-center gap-3 rounded-md border border-border bg-surface p-4 backdrop-blur-md">
            <div className="flex-1 space-y-1">
              <textarea
                className="w-full bg-transparent text-sm outline-none"
                defaultValue={q.text}
                onBlur={(e) =>
                  e.target.value !== q.text &&
                  startTransition(async () => {
                    await updateQuote(q.id, { text: e.target.value });
                    router.refresh();
                  })
                }
              />
              <input
                className="w-full bg-transparent text-xs text-dim outline-none"
                placeholder="Attribution"
                defaultValue={q.attribution ?? ""}
                onBlur={(e) =>
                  e.target.value !== (q.attribution ?? "") &&
                  startTransition(async () => {
                    await updateQuote(q.id, { attribution: e.target.value || null });
                    router.refresh();
                  })
                }
              />
            </div>
            <select
              className="rounded border border-fg/20 bg-transparent px-1 py-1 text-xs"
              defaultValue={q.emphasis}
              onChange={(e) =>
                startTransition(async () => {
                  await updateQuote(q.id, { emphasis: Number(e.target.value) });
                  router.refresh();
                })
              }
            >
              <option value={1}>Emphasis 1</option>
              <option value={2}>Emphasis 2</option>
              <option value={3}>Emphasis 3</option>
            </select>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deleteQuote(q.id);
                  router.refresh();
                })
              }
              className="text-xs text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await createQuote({ text, attribution: attribution || undefined, emphasis });
            setText("");
            setAttribution("");
            setEmphasis(1);
            router.refresh();
          });
        }}
        className="space-y-2 rounded-md border border-border bg-surface p-4 backdrop-blur-md"
      >
        <h2 className="text-sm text-dim">New quote</h2>
        <textarea
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          placeholder="Quote text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          placeholder="Attribution"
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
        />
        <select
          className="rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
          value={emphasis}
          onChange={(e) => setEmphasis(Number(e.target.value) as 1 | 2 | 3)}
        >
          <option value={1}>Emphasis 1</option>
          <option value={2}>Emphasis 2</option>
          <option value={3}>Emphasis 3</option>
        </select>
        <button type="submit" className="rounded border border-fg/20 px-3 py-1.5 text-sm">
          + Add quote
        </button>
      </form>
    </div>
  );
}
