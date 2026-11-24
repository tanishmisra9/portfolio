"use client";

import { useState, type FormEvent } from "react";
import type { InferSelectModel } from "drizzle-orm";
import type { radioTriggers } from "@/db/schema";
import { Button } from "@/components/admin/ui/button";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { Field, Input } from "@/components/admin/ui/field";
import { EmptyState, Panel, Tag } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { createRadioTrigger, deleteRadioTrigger, updateRadioTrigger } from "@/lib/admin/actions";

type Trigger = InferSelectModel<typeof radioTriggers>;

export function TriggerManager({ triggers, liveTexts }: { triggers: Trigger[]; liveTexts: string[] }) {
  const status = useSaveStatus();
  const [newText, setNewText] = useState("");
  const [errors, setErrors] = useState<Record<number | "new", string>>({} as Record<number | "new", string>);

  /** The actions report a rejected word by returning a message; throw it so the status chip says "Couldn't save" too. */
  const check = (call: () => Promise<string | null>) => async () => {
    const error = await call();
    if (error) throw new Error(error);
  };

  function handleUpdate(id: number, value: string, previous: string) {
    if (value === previous) return;
    void (async () => {
      const result = await status.run(check(() => updateRadioTrigger(id, value)));
      setErrors((prev) => ({ ...prev, [id]: result.ok ? "" : result.error }));
    })();
  }

  function handleDelete(id: number) {
    void status.run(() => deleteRadioTrigger(id));
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    void (async () => {
      const result = await status.run(check(() => createRadioTrigger(newText)));
      setErrors((prev) => ({ ...prev, new: result.ok ? "" : result.error }));
      if (result.ok) setNewText("");
    })();
  }

  return (
    <div className="space-y-4">
      <SaveStatus state={status} />
      <div className="space-y-2">
        {triggers.map((t) => {
          const isNew = !liveTexts.includes(t.text);
          return (
            <div key={t.id} className={`flex flex-wrap items-center gap-3 border bg-surface p-3 backdrop-blur-md ${isNew ? "border-fg" : "border-border"}`}>
              <div className="min-w-0 flex-1 basis-48">
                <Input aria-label="Trigger word" defaultValue={t.text} onBlur={(e) => handleUpdate(t.id, e.target.value, t.text)} />
                {errors[t.id] && <p role="alert" className="mt-1 text-sm text-danger">{errors[t.id]}</p>}
              </div>
              {isNew && <Tag>New</Tag>}
              <DeleteButton label={`Delete trigger ${t.text}`} onConfirm={() => handleDelete(t.id)} />
            </div>
          );
        })}
        {triggers.length === 0 && (
          <EmptyState>No custom triggers: &quot;bbb&quot; and &quot;boxbox&quot; are used as a fallback.</EmptyState>
        )}
      </div>

      <Panel>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label="New trigger word" error={errors.new} className="min-w-48 flex-1">
            <Input placeholder="e.g. telemetry" value={newText} onChange={(e) => setNewText(e.target.value)} required />
          </Field>
          <Button type="submit" variant="primary">
            Add trigger
          </Button>
        </form>
      </Panel>
    </div>
  );
}
