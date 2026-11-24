import { listDraftPosts } from "@/lib/admin/actions";
import { AdminHeading } from "@/components/admin/ui/panel";
import { NewPostForm } from "./new-post-form";
import { PostList } from "./post-list";

export default async function BlogAdminPage() {
  const posts = await listDraftPosts();

  return (
    <div className="max-w-5xl">
      <AdminHeading title="Thoughts" subtitle="Posts live as drafts until you publish." />
      <NewPostForm />
      <PostList posts={posts.map((p) => ({ slug: p.slug, title: p.title, date: p.date }))} />
    </div>
  );
}
