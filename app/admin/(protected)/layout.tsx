import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { DirtyProvider } from "@/components/admin/dirty-context";
import { hasUnpublishedChanges } from "@/lib/admin/publish";
import { getSession, isSessionExpired } from "@/lib/auth/session";

/** The change check reads every draft table; streaming it keeps the page from waiting on it. */
async function ChangesHeader() {
  return <AdminHeader hasChanges={await hasUnpublishedChanges()} />;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (isSessionExpired(session)) redirect("/admin/login");
  return (
    <DirtyProvider>
      <div className="admin-scope min-h-screen bg-bg font-display text-fg">
        <Suspense fallback={<AdminHeader />}>
          <ChangesHeader />
        </Suspense>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </DirtyProvider>
  );
}
