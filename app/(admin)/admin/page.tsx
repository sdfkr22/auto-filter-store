import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const sb = createAdminClient();

  const [totalRes, noPriceRes, noStockRes, inactiveRes] = await Promise.all([
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("products").select("id", { count: "exact", head: true }).or("price.is.null,price.eq.0"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("stock", 0),
    sb.from("products").select("id", { count: "exact", head: true }).eq("active", false),
  ]);

  const stats = [
    { label: "Toplam Ürün", value: totalRes.count ?? 0, href: "/admin/urunler" },
    { label: "Fiyatsız Ürün", value: noPriceRes.count ?? 0, href: "/admin/urunler?filter=no-price", warn: true },
    { label: "Stoksuz Ürün", value: noStockRes.count ?? 0, href: "/admin/urunler?filter=no-stock", warn: true },
    { label: "Pasif Ürün", value: inactiveRes.count ?? 0, href: "/admin/urunler?filter=inactive" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{
              display: "block",
              background: "#141414",
              border: `1px solid ${s.warn && s.value > 0 ? "#5a3a1a" : "#222"}`,
              borderRadius: 8,
              padding: 20,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.warn && s.value > 0 ? "#e6a04a" : "#fff" }}>
              {s.value.toLocaleString("tr-TR")}
            </div>
          </Link>
        ))}
      </div>

      <section style={{ background: "#141414", border: "1px solid #222", borderRadius: 8, padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Hızlı işlemler</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/urunler" style={quickActionStyle}>Ürünleri yönet</Link>
          <Link href="/admin/siparisler" style={quickActionStyle}>Siparişleri görüntüle</Link>
        </div>
      </section>
    </div>
  );
}

const quickActionStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  background: "#1f1f1f",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  color: "#e5e5e5",
  textDecoration: "none",
  fontSize: 14,
};
