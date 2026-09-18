"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { radioTriggers } from "@/db/schema";
import { createRadioTrigger, deleteRadioTrigger, updateRadioTrigger } from "@/lib/admin/actions";

type Trigger = InferSelectModel<typeof radioTriggers>;

export function TriggerManager({ triggers }: { triggers: Trigger[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newText, setNewText] = useState("");
  const [errors, setErrors] = useState<Record<number | "new", string>>({} as Record<number | "new", string>);

  function handleUpdate(id: number, value: string, previous: string) {
    if (value === previous) return;
    startTransition(async () => {
      const error = await updateRadioTrigger(id, value);
      setErrors((prev) => ({ ...prev, [id]: error ?? "" }));
      if (!error) router.refresh();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteRadioTrigger(id);
      router.refresh();
    });
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const error = await createRadioTrigger(newText);
      setErrors((prev) => ({ ...prev, new: error ?? "" }));
      if (!error) {
        setNewText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {triggers.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 backdrop-blur-md"
          >
            <div className="flex-1">
              <input
                className="w-full bg-transparent text-base outline-none"
                defaultValue={t.text}
                onBlur={(e) => handleUpdate(t.id, e.target.value, t.text)}
              />
              {errors[t.id] && <p className="text-sm text-red-500">{errors[t.id]}</p>}
            </div>
            <button type="button" onClick={() => handleDelete(t.id)} className="text-sm text-red-500">
              Delete
            </button>
          </div>
        ))}
        {triggers.length === 0 && (
          <p className="text-muted">
            No custom triggers — &quot;bbb&quot; and &quot;boxbox&quot; are used as a fallback.
          </p>
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-2 rounded-md border border-border bg-surface p-4 backdrop-blur-md"
      >
        <h2 className="text-sm text-dim">New trigger</h2>
        <input
          className="w-full rounded border border-fg/20 bg-transparent px-2 py-1 text-base"
          placeholder="e.g. telemetry"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          required
        />
        {errors.new && <p className="text-sm text-red-500">{errors.new}</p>}
        <button type="submit" className="rounded border border-fg/20 px-3 py-1.5 text-base">
          + Add trigger
        </button>
      </form>
    </div>
  );
}
