"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconButton } from "@/components/ui/icon-button";
import { HOVER_FILL_LINK, HoverFill } from "@/components/ui/hover-fill";
import { Button } from "@/components/admin/ui/button";
import { SaveStatus } from "@/components/admin/ui/save-status";
import { useSaveStatus } from "@/components/admin/ui/use-save-status";
import { ADMIN_SECTIONS } from "@/components/admin/sections";
import { logout } from "@/lib/auth/actions";
import { publishAll } from "@/lib/admin/actions";
import { useAdminDirty } from "@/components/admin/dirty-context";

const NAV_LINK = `${HOVER_FILL_LINK} px-4 py-2 text-sm tracking-wide text-muted aria-[current=page]:text-fg aria-[current=page]:ring-fg`;
const noMouseFocus = (e: React.MouseEvent) => e.preventDefault();

type Ask = { message: string; confirm: string; onConfirm: () => void };

/** `hasChanges` is undefined while the layout is still working it out (streamed), so Publish stays disabled without claiming "Published". */
export function AdminHeader({ hasChanges }: { hasChanges?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const publishing = useSaveStatus();
  const [ask, setAsk] = useState<Ask | null>(null);
  const { dirty } = useAdminDirty();
  const logoutForm = useRef<HTMLFormElement>(null);
  const bypassLogout = useRef(false);

  // One guard for every in-app link (nav, logo, back buttons, dashboard cards, View site): with unsaved edits, ask first.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.origin !== location.origin || a.pathname + a.search === location.pathname + location.search) return;
      e.preventDefault();
      e.stopPropagation();
      const href = a.pathname + a.search + a.hash;
      setAsk({ message: "You have unsaved changes on this page.", confirm: "Leave without saving", onConfirm: () => router.push(href) });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, router]);

  // Esc dismisses the confirm banner.
  useEffect(() => {
    if (!ask) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAsk(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ask]);

  function doPublish() {
    startTransition(async () => {
      await publishing.run(() => publishAll());
    });
  }
  function handlePublish() {
    if (dirty) {
      setAsk({ message: "Unsaved edits on this page won’t be included in the publish.", confirm: "Publish anyway", onConfirm: doPublish });
    } else doPublish();
  }

  const publishLabel = pending ? "Publishing…" : hasChanges === false ? "Published ✓" : "Publish";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-x-3 px-6">
        <Link href="/admin" aria-label="Admin home" onMouseDown={noMouseFocus} className={`${HOVER_FILL_LINK} -ml-3 px-3 py-2 font-display text-lg font-extrabold text-fg`}>
          <HoverFill>TM</HoverFill>
        </Link>
        <nav aria-label="Admin sections" className="ml-3 hidden items-center gap-1 md:flex">
          {ADMIN_SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} aria-current={pathname?.startsWith(s.href) ? "page" : undefined} onMouseDown={noMouseFocus} className={NAV_LINK}>
              <HoverFill>{s.title}</HoverFill>
            </Link>
          ))}
        </nav>
        <div className="relative ml-auto flex items-center gap-2">
          {dirty && <span className="px-2 text-sm text-danger">Unsaved changes</span>}
          <SaveStatus state={publishing} failed="Couldn’t publish" done="" className="hidden sm:inline" />
          <IconButton href="/" icon={<ExternalLink />} label="View site" target="_blank" />
          <ThemeToggle />
          <Button variant="primary" className="min-h-12 whitespace-nowrap !px-3 md:!px-4" onClick={handlePublish} pending={pending} disabled={!hasChanges}>
            {publishLabel}
          </Button>
          <form
            ref={logoutForm}
            action={logout}
            onSubmit={(e) => {
              if (dirty && !bypassLogout.current) {
                e.preventDefault();
                setAsk({
                  message: "You have unsaved changes on this page.",
                  confirm: "Log out anyway",
                  onConfirm: () => {
                    bypassLogout.current = true;
                    logoutForm.current?.requestSubmit();
                  },
                });
              }
            }}
          >
            <Button type="submit" className="min-h-12 whitespace-nowrap !px-3 md:!px-4">
              Log out
            </Button>
          </form>
        </div>
      </div>
      <nav aria-label="Admin sections" className="flex overflow-x-auto border-t border-border px-3 py-1 md:hidden">
        {ADMIN_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} aria-current={pathname?.startsWith(s.href) ? "page" : undefined} onMouseDown={noMouseFocus} className={`${NAV_LINK} shrink-0 !px-2.5`}>
            <HoverFill>{s.title}</HoverFill>
          </Link>
        ))}
      </nav>
      {ask && (
        <div role="alert" className="border-t border-border bg-bg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
            <p className="mr-auto text-sm text-fg">{ask.message}</p>
            <Button variant="danger" size="sm" onClick={() => { const go = ask.onConfirm; setAsk(null); go(); }}>
              {ask.confirm}
            </Button>
            <Button size="sm" onClick={() => setAsk(null)}>
              Stay
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
