import type { Metadata } from "next";
import type { Components } from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getImageDimensions } from "@/lib/image-dimensions";
import { getPublishedData } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

// Same shared LQIP placeholder used by /photos (components/photos/photo-album-motion.tsx).
const BLOG_IMAGE_BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

const DEFAULT_IMG_W = 1600;
const DEFAULT_IMG_H = 900;

const components: Components = {
  h1: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-10">
      <h2 className="font-display text-3xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  h2: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-8">
      <h3 className="font-display text-2xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  h3: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-6">
      <h4 className="font-display text-xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  p: ({ node, children, ...rest }) => {
    const hasImage = node?.children?.some(
      (child) => child.type === "element" && child.tagName === "img",
    );
    if (hasImage) {
      return <div className="leading-relaxed">{children}</div>;
    }
    return (
      <ScrollReveal variant="slide">
        <p className="leading-relaxed" {...rest}>
          {children}
        </p>
      </ScrollReveal>
    );
  },
  a: ({ node, ...rest }) => (
    <a
      className="text-fg underline decoration-fg/40 underline-offset-2 hover:decoration-fg"
      {...rest}
    />
  ),
  ul: ({ node, ...rest }) => (
    <ScrollReveal variant="slide">
      <ul className="list-disc space-y-2 pl-6" {...rest} />
    </ScrollReveal>
  ),
  ol: ({ node, ...rest }) => (
    <ScrollReveal variant="slide">
      <ol className="list-decimal space-y-2 pl-6" {...rest} />
    </ScrollReveal>
  ),
  blockquote: ({ node, ...rest }) => (
    <ScrollReveal variant="slide">
      <blockquote
        className="border-l-2 border-border-strong pl-4 italic text-muted"
        {...rest}
      />
    </ScrollReveal>
  ),
  code({ node, className, children, ...rest }) {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-fg/10 px-1.5 py-0.5 font-mono text-sm text-fg"
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, ...rest }) => (
    <ScrollReveal variant="slide">
      <pre
        className="overflow-x-auto rounded-lg border border-border bg-fg/5 p-4 font-mono text-sm"
        {...rest}
      />
    </ScrollReveal>
  ),
  img: async ({ src, alt }) => {
    if (typeof src !== "string" || !src) return null;
    const dims = await getImageDimensions(src);
    return (
      <ScrollReveal variant="slide" className="my-6">
        <Image
          src={src}
          alt={alt ?? ""}
          width={dims?.width ?? DEFAULT_IMG_W}
          height={dims?.height ?? DEFAULT_IMG_H}
          style={{ width: "100%", height: "auto" }}
          sizes="(max-width: 768px) 100vw, 768px"
          placeholder="blur"
          blurDataURL={BLOG_IMAGE_BLUR_DATA_URL}
          quality={72}
          className="rounded-lg border border-border"
        />
      </ScrollReveal>
    );
  },
};

export async function generateStaticParams() {
  const data = await getPublishedData();
  return data.posts.map((post) => ({ slug: post.slug }));
}

// Posts now come from the DB, so a newly published post must render on first request
// without a redeploy — unlike the old fs-backed content, dynamicParams stays at its
// default (true). The public/blog/** file-tracing exclusion in next.config.ts is now
// moot too once migrated posts stop referencing local /public/blog paths.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedData();
  const post = data.posts.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found — Tanish Misra" };
  return {
    title: `${post.title} — Tanish Misra`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublishedData();
  const post = data.posts.find((p) => p.slug === slug);
  if (!post) notFound();

  // Album titles are 1-2 words; post titles are full sentences — the album clamp's mobile
  // floor (4.85rem) wraps a long title into 4-5 lines on a phone, so long titles get a
  // smaller mobile-range clamp. Desktop is unaffected (md:text-8xl overrides both).
  const isLongTitle = post.title.length > 20;
  const titleSizeClasses = isLongTitle
    ? "text-[clamp(2.5rem,9vw,6.35rem)]"
    : "text-[clamp(4.85rem,16.5vw,6.35rem)]";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24"
    >
      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 text-[0.9625rem] text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 md:mb-12"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to blog
        </Link>

        <header className="text-center">
          <time className="font-mono text-xs uppercase tracking-wide text-dim">
            {new Date(`${post.date}T00:00`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <h1
            className={`heading-bleed-mobile mx-auto max-w-full select-none py-2 font-display ${titleSizeClasses} font-extrabold uppercase leading-[1.08] tracking-tighter text-fg md:text-8xl`}
          >
            {post.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted md:text-xl">
            {post.description}
          </p>
        </header>

        <div className="mt-12 space-y-6 text-fg">
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {post.content}
          </Markdown>
        </div>
      </article>
    </main>
  );
}
