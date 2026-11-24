"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CONTENT_SUBTITLE_CLASSES, CONTENT_TITLE_CLASSES } from "@/components/ui/class-constants";

/*
 * Admin live preview of a post. Mirrors app/thoughts/[slug]/page.tsx: same header classes, same react-markdown
 * element overrides. Differences on purpose: no ScrollReveal (a preview must show everything at once, and the
 * reveal would hide blocks until scrolled into the preview's own scroller) and a plain <img> instead of the async
 * next/image (that one reads remote dimensions on the server). If the public overrides change, change these too.
 */
const components: Components = {
  h1: ({ node, ...rest }) => <h2 className="mt-10 font-display text-3xl font-bold text-fg" {...rest} />,
  h2: ({ node, ...rest }) => <h3 className="mt-8 font-display text-2xl font-bold text-fg" {...rest} />,
  h3: ({ node, ...rest }) => <h4 className="mt-6 font-display text-xl font-bold text-fg" {...rest} />,
  p: ({ node, children, ...rest }) => {
    // Any img below the paragraph (a linked image nests it inside <a>); same check as the public page.
    const hasImg = (n: { type: string; tagName?: string; children?: unknown[] }): boolean =>
      (n.type === "element" && n.tagName === "img") || (n.children ?? []).some((c) => hasImg(c as typeof n));
    const hasImage = node ? hasImg(node) : false;
    return hasImage ? (
      <div className="leading-relaxed">{children}</div>
    ) : (
      <p className="leading-relaxed" {...rest}>
        {children}
      </p>
    );
  },
  // The preview must never navigate the editor away from unsaved work.
  a: ({ node, ...rest }) => (
    <a
      className="text-fg underline decoration-fg/40 underline-offset-2 hover:decoration-fg"
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    />
  ),
  ul: ({ node, ...rest }) => <ul className="list-disc space-y-2 pl-6" {...rest} />,
  ol: ({ node, ...rest }) => <ol className="list-decimal space-y-2 pl-6" {...rest} />,
  blockquote: ({ node, ...rest }) => <blockquote className="border-l-2 border-border-strong pl-4 italic text-muted" {...rest} />,
  code({ node, className, children, ...rest }) {
    if (/language-/.test(className ?? "")) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-fg/10 px-1.5 py-0.5 font-mono text-sm text-fg" {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ node, ...rest }) => <pre className="overflow-x-auto rounded-lg border border-border bg-fg/5 p-4 font-mono text-sm" {...rest} />,
  img: ({ src, alt }) =>
    typeof src === "string" && src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} loading="lazy" className="my-6 h-auto w-full rounded-lg border border-border" />
    ) : null,
};

export function PostPreview({ title, description, date, body }: { title: string; description: string; date: string; body: string }) {
  return (
    <article aria-label="Post preview" className="font-sans text-fg">
      <header>
        <h1 className={`${CONTENT_TITLE_CLASSES} text-balance text-fg`}>{title.trim() || "Untitled"}</h1>
        {description.trim() && <p className={CONTENT_SUBTITLE_CLASSES}>{description}</p>}
        {date && (
          <time className="mt-3 block text-sm text-dim">
            {new Date(`${date}T00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        )}
      </header>
      <div className="mt-10 space-y-6 text-fg">
        {body.trim() ? (
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {body}
          </Markdown>
        ) : (
          <p className="text-dim">Nothing to preview yet. Write something in the body.</p>
        )}
      </div>
    </article>
  );
}
