"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/admin/ui/delete-button";
import { EmptyState } from "@/components/admin/ui/panel";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { deletePost } from "@/lib/admin/actions";

type Row = { slug: string; title: string; date: string };

/** The post list. Each card is one stretched link (the title's ::after) with the delete control above it, since a button can't nest inside an <a>. */
export function PostList({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const status = useSaveStatus();

  async function remove(slug: string) {
    const result = await status.run(() => deletePost(slug));
    if (result.ok) router.refresh();
  }

  return (
    <div className="mt-8 space-y-3">
      <SaveStatus state={status} failed="Couldn’t delete" done="Deleted" />
      {posts.length === 0 && <EmptyState>No posts yet. Add one above.</EmptyState>}
      {posts.map((p) => (
        <div
          key={p.slug}
          className="relative flex items-center gap-4 border border-border bg-surface p-4 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] has-[:focus-visible]:-translate-x-0.5 has-[:focus-visible]:-translate-y-0.5 has-[:focus-visible]:border-fg motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/blog/${p.slug}`}
              className="block font-display text-lg font-bold text-fg after:absolute after:inset-0 after:z-[1] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-fg/70"
            >
              {p.title || "Untitled"}
            </Link>
            <div className="mt-1 text-sm text-dim">
              /thoughts/{p.slug} · {p.date}
            </div>
          </div>
          <div className="relative z-10">
            <DeleteButton label={`Delete ${p.title || p.slug}`} onConfirm={() => void remove(p.slug)} />
          </div>
        </div>
      ))}
    </div>
  );
}
