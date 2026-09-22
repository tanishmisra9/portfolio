import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { DirtyProvider } from "@/components/admin/dirty-context";
import { hasUnpublishedChanges } from "@/lib/admin/publish";
import { getSession, isSessionExpired } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (isSessionExpired(session)) redirect("/admin/login");
  const hasChanges = await hasUnpublishedChanges();
  return (
    <DirtyProvider>
      <div className="admin-scope min-h-screen bg-bg font-display text-fg">
        <AdminHeader hasChanges={hasChanges} />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </DirtyProvider>
  );
}
