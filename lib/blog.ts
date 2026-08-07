import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

function readSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(): BlogPostMeta[] {
  return readSlugs()
    .map((slug) => {
      const { data } = matter(
        fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8"),
      );
      return {
        slug,
        title: data.title,
        date: data.date,
        description: data.description,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: data.title,
    date: data.date,
    description: data.description,
    content,
  };
}

export const getAllSlugs = readSlugs;
