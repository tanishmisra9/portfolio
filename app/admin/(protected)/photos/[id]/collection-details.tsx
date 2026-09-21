"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCollection } from "@/lib/admin/actions";

const fieldClass =
  "w-full rounded border border-border-strong bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

export function CollectionDetails({
  id,
  title,
  description,
}: {
  id: number;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function save(fields: { title?: string; description?: string }) {
    startTransition(async () => {
      await updateCollection(id, fields);
      router.refresh();
    });
  }

  return (
    <div className="mb-8 grid gap-4 rounded-md border border-border bg-surface p-4 backdrop-blur-md sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-base text-dim">Title</span>
        <input
          className={fieldClass}
          defaultValue={title}
          onBlur={(e) => e.target.value.trim() && e.target.value !== title && save({ title: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-base text-dim">Description</span>
        <input
          className={fieldClass}
          defaultValue={description}
          onBlur={(e) => e.target.value !== description && save({ description: e.target.value })}
        />
      </label>
    </div>
  );
}
