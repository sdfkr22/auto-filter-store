import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import AccountSubHeader from "@/components/AccountSubHeader";

export const metadata: Metadata = { title: "Siparişlerim" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  awaiting_payment: "Ödeme Bekleniyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
  refunded: "İade Edildi",
};

const fmt = (n: number) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 860, margin: "0 auto", padding: "40px 24px" } as const,
  h1: { fontSize: 22, fontWeight: 600, marginBottom: 8 } as const,
  sub: { fontSize: 13, color: "#666", marginBottom: 32 } as const,
  empty: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 40, textAlign: "center" as const, color: "#888" },
  row: { display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px", gap: 12, alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #181818", background: "#111", textDecoration: "none", color: "inherit", fontSize: 14 } as const,
  headerRow: { display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px", gap: 12, padding: "10px 18px", background: "#0c0c0c", borderBottom: "1px solid #1f1f1f", fontSize: 11, color: "#777", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 },
};

export default async function SiparislerimPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris");

  const { data: orders } = await sb
    .from("orders")
    .select("id, order_no, status, total, currency, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />
      <AccountSubHeader trail={[{ href: "/hesabim", label: "Hesabım" }, { label: "Siparişlerim" }]} />

      <main style={s.main}>
        <h1 style={s.h1}>Siparişlerim</h1>
        <p style={s.sub}>Son 50 siparişiniz. Detay için satıra tıklayın.</p>

        {(orders ?? []).length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <div>Henüz siparişiniz yok.</div>
            <Link href="/urunler" style={{ display: "inline-block", marginTop: 16, color: "#FFED00", textDecoration: "none", fontSize: 13 }}>
              Alışverişe başla →
            </Link>
          </div>
        ) : (
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1a1a1a" }}>
            <div style={s.headerRow}>
              <div>Sipariş No</div>
              <div>Durum</div>
              <div>Tutar</div>
              <div>Tarih</div>
              <div></div>
            </div>
            {(orders ?? []).map((o) => (
              <Link key={o.id} href={`/hesabim/siparislerim/${o.id}`} style={s.row}>
                <div style={{ fontFamily: "monospace", color: "#fff", fontSize: 13 }}>{o.order_no}</div>
                <div><span style={statusBadge(o.status)}>{STATUS_LABELS[o.status] ?? o.status}</span></div>
                <div style={{ fontFamily: "monospace" }}>{fmt(o.total)}</div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("tr-TR") : "—"}
                </div>
                <div style={{ textAlign: "right", color: "#555", fontSize: 12 }}>Detay →</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    pending:          { bg: "#3a2a1a", fg: "#e6a04a" },
    awaiting_payment: { bg: "#3a2a1a", fg: "#e6a04a" },
    paid:             { bg: "#1a3a2a", fg: "#7ad19a" },
    preparing:        { bg: "#1a2a3a", fg: "#7a9ad1" },
    shipped:          { bg: "#1a2a3a", fg: "#7a9ad1" },
    delivered:        { bg: "#1a3a1a", fg: "#7ad17a" },
    cancelled:        { bg: "#3a1a1a", fg: "#d17a7a" },
    refunded:         { bg: "#2a1a3a", fg: "#a07ad1" },
  };
  const c = colors[status] ?? { bg: "#222", fg: "#aaa" };
  return { display: "inline-block", padding: "3px 10px", background: c.bg, color: c.fg, fontSize: 11, borderRadius: 4, fontWeight: 600 };
}
