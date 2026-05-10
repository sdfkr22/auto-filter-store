import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = {
  title: "Yönetim Paneli",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          background: "#0d0d0d",
          borderRight: "1px solid #1f1f1f",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div>
          <Link
            href="/admin"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
            }}
          >
            auto-filter <span style={{ color: "#888", fontWeight: 400 }}>admin</span>
          </Link>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <AdminNavLink href="/admin">Dashboard</AdminNavLink>
          <AdminNavLink href="/admin/urunler">Ürünler</AdminNavLink>
          <AdminNavLink href="/admin/siparisler">Siparişler</AdminNavLink>
        </nav>

        <div style={{ marginTop: "auto", fontSize: 12, color: "#666" }}>
          <div style={{ marginBottom: 8 }}>{admin.email}</div>
          <Link href="/" style={{ color: "#888", textDecoration: "none" }}>
            ← Mağazaya dön
          </Link>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "32px 40px",
          background: "#090909",
          color: "#e5e5e5",
        }}
      >
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "8px 12px",
        borderRadius: 6,
        color: "#cfcfcf",
        textDecoration: "none",
        fontSize: 14,
      }}
    >
      {children}
    </Link>
  );
}
