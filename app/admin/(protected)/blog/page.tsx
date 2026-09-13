import Link from "next/link";
import { listDraftPosts } from "@/lib/admin/actions";
import { NewPostForm } from "./new-post-form";

export default async function BlogAdminPage() {
  const posts = await listDraftPosts();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl">Blog posts</h1>
      <div className="space-y-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/blog/${p.slug}`}
            className="block rounded border border-fg/10 p-3 hover:bg-fg/5"
          >
            <div className="text-sm">{p.title}</div>
            <div className="text-xs text-dim">
              /{p.slug} — {p.date}
            </div>
          </Link>
        ))}
      </div>
      <NewPostForm />
    </div>
  );
}
