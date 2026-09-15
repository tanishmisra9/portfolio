import { AdminHeader } from "@/components/admin/admin-header";
import { DirtyProvider } from "@/components/admin/dirty-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DirtyProvider>
      <div className="min-h-screen bg-bg font-display text-fg">
        <AdminHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </DirtyProvider>
  );
}
