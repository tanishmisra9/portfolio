import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { PostEditor } from "./post-editor";

export default async function PostEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));

  return (
    <div className="max-w-5xl">
      <PostEditor
        slug={slug}
        initial={
          post ?? {
            slug,
            title: "",
            date: new Date().toISOString().slice(0, 10),
            description: "",
            body: "",
          }
        }
        isNew={!post}
      />
    </div>
  );
}
