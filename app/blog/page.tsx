import { BlogIndexMotion } from "@/components/blog/blog-index-motion";
import { getAllPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();

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
