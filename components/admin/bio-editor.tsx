"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/admin/ui/button";
import { Input, Textarea } from "@/components/admin/ui/field";
import { bioMarkdownComponents, bioMarkdownAllowedElements } from "@/components/bio-markdown";

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

  const [previewOne = "", ...previewRest] = value.split("\n\n").filter((p) => p.trim());

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => wrapSelection("**", "**")} aria-label="Bold" className="font-bold">
          B
        </Button>
        <Button size="sm" onClick={startLink} className="underline">
          Link
        </Button>
      </div>

      {linkPrompt && (
        <div className="flex flex-wrap items-center gap-2 border border-border-strong p-2">
          <Input
            autoFocus
            className="min-w-0 flex-1"
            aria-label="Link URL"
            placeholder="/photos or https://example.com"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkError(null);
            }}
          />
          <Button variant="primary" size="sm" onClick={confirmLink}>
            Insert
          </Button>
          <Button size="sm" onClick={() => setLinkPrompt(null)}>
            Cancel
          </Button>
          {linkError && <p className="w-full text-sm text-danger">{linkError}</p>}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        aria-label="About bio"
        className="font-mono"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="space-y-2 border border-border p-3 text-base">
        <p className="text-base text-dim">Preview</p>
        <p>
          <Markdown components={bioMarkdownComponents} allowedElements={bioMarkdownAllowedElements} unwrapDisallowed>{previewOne}</Markdown>
        </p>
        {previewRest.map((para, i) => (
          <p key={i}>
            <Markdown components={bioMarkdownComponents} allowedElements={bioMarkdownAllowedElements} unwrapDisallowed>{para}</Markdown>
          </p>
        ))}
      </div>
    </div>
  );
}
