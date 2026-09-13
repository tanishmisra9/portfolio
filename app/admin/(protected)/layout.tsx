import Link from "next/link";
import { PublishBar } from "@/components/admin/publish-bar";
import { logout } from "@/lib/auth/actions";

const NAV = [
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/blog", label: "Blog" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PublishBar />
      <div className="flex">
        <nav className="w-48 shrink-0 space-y-1 border-r border-fg/10 p-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-1.5 text-sm hover:bg-fg/5"
            >
              {item.label}
            </Link>
          ))}
          <form action={logout} className="pt-4">
            <button type="submit" className="px-3 py-1.5 text-sm text-dim hover:text-fg">
              Log out
            </button>
          </form>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
