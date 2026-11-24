import { BlogIndexMotion } from "@/components/blog/blog-index-motion";
import { getPublishedData } from "@/lib/site-content";

export default async function BlogPage() {
  const data = await getPublishedData();
  // BlogIndexMotion only renders title/date/description/slug — drop each post's full
  // markdown body rather than shipping it to the client for every post on the index.
  const posts = [...data.posts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _content, ...meta }) => meta);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24"
    >
      <BlogIndexMotion posts={posts} />
    </main>
  );
}
