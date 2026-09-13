"use client";

import { useState, useTransition } from "react";
import { publishAll } from "@/lib/admin/actions";

export function PublishBar() {
  const [pending, startTransition] = useTransition();
  const [justPublished, setJustPublished] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b border-fg/10 px-4 py-3">
      <span className="text-sm text-dim">
        Edits save as drafts. Nothing goes live until you publish.
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await publishAll();
            setJustPublished(true);
            setTimeout(() => setJustPublished(false), 3000);
          })
        }
        className="ml-auto rounded bg-fg px-4 py-1.5 text-sm text-bg disabled:opacity-50"
      >
        {pending ? "Publishing..." : justPublished ? "Published ✓" : "Publish"}
      </button>
    </div>
  );
}
