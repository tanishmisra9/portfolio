import type { Metadata } from "next";
import type { Components } from "react-markdown";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CONTENT_SUBTITLE_CLASSES, CONTENT_TITLE_CLASSES } from "@/components/ui/class-constants";
import { BackButton } from "@/components/ui/back-button";
import { PostImage } from "@/components/blog/post-image";
import { PostJump, PostToc } from "@/components/blog/post-toc";
import { extractHeadings, remarkHeadingIds, remarkImageMeta } from "@/lib/post-headings";
import { getImageDimensions } from "@/lib/image-dimensions";
import { getPublishedData } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

const DEFAULT_IMG_W = 1600;
const DEFAULT_IMG_H = 900;

const components: Components = {
  h1: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-10">
      <h2 className="scroll-mt-28 font-display text-3xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  h2: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-8">
      <h3 className="scroll-mt-28 font-display text-2xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  h3: ({ node, ...rest }) => (
    <ScrollReveal variant="slide" className="mt-6">
      <h4 className="scroll-mt-28 font-display text-xl font-bold text-fg" {...rest} />
    </ScrollReveal>
  ),
  p: ({ node, children, ...rest }) => {
    // Any img below the paragraph (a linked image nests it inside <a>) renders a block wrapper, which can't sit in a <p>.
    const hasImg = (n: { type: string; tagName?: string; children?: unknown[] }): boolean =>
      (n.type === "element" && n.tagName === "img") || (n.children ?? []).some((c) => hasImg(c as typeof n));
    const hasImage = node ? hasImg(node) : false;
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
  // Post links open in a new tab, except in-page anchors (#footnote, #heading), which must stay on the page.
  a: ({ node, href, ...rest }) => (
    <a
      href={href}
      {...(href?.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
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
  img: async ({ src, alt, ...rest }) => {
    if (typeof src !== "string" || !src) return null;
    const dims = await getImageDimensions(src);
    const meta = rest as { "data-caption"?: string; "data-linked"?: string }; // stamped by remarkImageMeta
    return (
      <ScrollReveal variant="slide" className="my-6">
        <PostImage
          src={src}
          alt={alt ?? ""}
          width={dims?.width ?? DEFAULT_IMG_W}
          height={dims?.height ?? DEFAULT_IMG_H}
          caption={meta["data-caption"]}
          linked={meta["data-linked"] === "true"}
        />
      </ScrollReveal>
    );
  },
};

export async function generateStaticParams() {
  const data = await getPublishedData();
  return data.posts.map((post) => ({ slug: post.slug }));
}

// Posts come from the DB, so a newly published post must render on first request
// without a redeploy — dynamicParams therefore stays at its default (true).

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

  const headings = extractHeadings(post.content);
  const hasToc = headings.length >= 2;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24"
    >
      {/* The article spans the header's container (w-screen max-w-6xl, centred on the viewport) with the header's px-6, so
          the back button, title and body all share the "TM" logo's left edge; the title and body use max-w-5xl of it. */}
      <article className="relative left-1/2 w-screen max-w-6xl -translate-x-1/2 px-6">
        <BackButton href="/thoughts" label="Back to thoughts" />

        {/* pl-5 (1.25rem) lines the text up with the back button's chevron, the visible start of the button, rather than its faint border box. */}
        <div className="max-w-5xl pl-5">
          <header>
            <h1 className={`${CONTENT_TITLE_CLASSES} text-balance text-fg`}>{post.title}</h1>
            <p className={CONTENT_SUBTITLE_CLASSES}>{post.description}</p>
            <time className="mt-3 block text-sm text-dim">
              {new Date(`${post.date}T00:00`).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </header>

          {/* The TOC column exists only when there is a TOC: reserving it always pushed short posts' text ~16rem
              right of their title on xl screens, next to an empty gutter. */}
          <div className={`mt-12 ${hasToc ? "xl:grid xl:grid-cols-[13rem_minmax(0,1fr)] xl:gap-12" : ""}`}>
            {hasToc && <PostToc headings={headings} />}
            <div className={`space-y-6 text-fg ${hasToc ? "xl:col-start-2" : ""}`}>
              {hasToc && <PostJump headings={headings} />}
              <Markdown remarkPlugins={[remarkGfm, remarkHeadingIds, remarkImageMeta]} components={components}>
                {post.content}
              </Markdown>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
