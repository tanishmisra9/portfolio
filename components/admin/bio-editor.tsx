"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";
import { bioMarkdownComponents } from "@/components/bio-markdown";

function validateUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter a URL.";
  if (value.startsWith("/")) {
    return /^\/[a-zA-Z0-9\-/_]*$/.test(value) ? null : "Internal paths can't contain spaces or protocols.";
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Only http(s) links or internal paths (starting with /) are allowed.";
    }
    return null;
  } catch {
    return "Enter a valid URL (https://…) or an internal path (/photos).";
  }
}

/** Bold + link toolbar over a plain textarea, storing markdown — no contentEditable/HTML sanitization needed. */
export function BioEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkPrompt, setLinkPrompt] = useState<{ start: number; end: number; selected: string } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + before.length, selectionStart + before.length + selected.length);
    });
  }

  function startLink() {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    setLinkPrompt({ start: selectionStart, end: selectionEnd, selected: value.slice(selectionStart, selectionEnd) });
    setLinkUrl("");
    setLinkError(null);
  }

  function confirmLink() {
    if (!linkPrompt) return;
    const error = validateUrl(linkUrl);
    if (error) {
      setLinkError(error);
      return;
    }
    const { start, end, selected } = linkPrompt;
    const label = selected || linkUrl;
    const next = `${value.slice(0, start)}[${label}](${linkUrl.trim()})${value.slice(end)}`;
    onChange(next);
    setLinkPrompt(null);
  }

  const [previewOne = "", previewTwo = ""] = value.split("\n\n");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => wrapSelection("**", "**")}
          className="rounded border border-fg/20 px-2 py-1 text-sm font-bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={startLink}
          className="rounded border border-fg/20 px-2 py-1 text-sm underline"
        >
          Link
        </button>
      </div>

      {linkPrompt && (
        <div className="flex flex-wrap items-center gap-2 rounded border border-fg/20 p-2">
          <input
            autoFocus
            className="min-w-0 flex-1 rounded border border-fg/20 bg-transparent px-2 py-1 text-sm"
            placeholder="/photos or https://example.com"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkError(null);
            }}
          />
          <button type="button" onClick={confirmLink} className="rounded bg-fg px-2 py-1 text-sm text-bg">
            Insert
          </button>
          <button type="button" onClick={() => setLinkPrompt(null)} className="text-sm text-dim">
            Cancel
          </button>
          {linkError && <p className="w-full text-sm text-red-500">{linkError}</p>}
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="w-full rounded border border-fg/20 bg-transparent px-2 py-1.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="space-y-2 rounded border border-fg/10 bg-fg/[0.02] p-3 text-sm">
        <p className="text-sm text-dim">Preview</p>
        <p>
          <Markdown components={bioMarkdownComponents}>{previewOne}</Markdown>
        </p>
        {previewTwo && (
          <p>
            <Markdown components={bioMarkdownComponents}>{previewTwo}</Markdown>
          </p>
        )}
      </div>
    </div>
  );
}
