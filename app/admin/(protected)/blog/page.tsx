import Link from "next/link";
import { listDraftPosts } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { NewPostForm } from "./new-post-form";

export default async function BlogAdminPage() {
  const posts = await listDraftPosts();

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className={ADMIN_SECTION_HEADING_CLASSES}>Blog posts</h1>
      <div className="space-y-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/blog/${p.slug}`}
            className="block rounded-md border border-border bg-surface p-4 backdrop-blur-md transition-colors hover:border-hover-outline"
          >
            <div className="font-display text-base font-semibold text-fg">{p.title}</div>
            <div className="mt-1 font-mono text-base uppercase tracking-wide text-muted">
              /{p.slug} — {p.date}
            </div>
          </Link>
        ))}
      </div>
      <NewPostForm />
    </div>
  );
}
