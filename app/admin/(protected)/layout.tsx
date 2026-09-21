import { AdminHeader } from "@/components/admin/admin-header";
import { DirtyProvider } from "@/components/admin/dirty-context";
import { hasUnpublishedChanges } from "@/lib/admin/publish";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hasChanges = await hasUnpublishedChanges();
  return (
    <DirtyProvider>
      <div className="min-h-screen bg-bg font-display text-fg">
        <AdminHeader hasChanges={hasChanges} />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </DirtyProvider>
  );
}
