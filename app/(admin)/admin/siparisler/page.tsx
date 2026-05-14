import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

type SearchParams = Promise<{ status?: string }>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";

  const sb = createAdminClient();
  let query = sb
    .from("orders")
    .select("id, order_no, status, total, currency, created_at, user_id, payment_method", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data: orders, count } = await query;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>Siparişler</h1>
        <span style={{ color: "#888", fontSize: 13 }}>
          {(count ?? 0).toLocaleString("tr-TR")} sipariş
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <FilterChip href="/admin/siparisler" active={!status}>Tümü</FilterChip>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <FilterChip key={key} href={`/admin/siparisler?status=${key}`} active={status === key}>
            {label}
          </FilterChip>
        ))}
      </div>

      <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
        {(orders ?? []).length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div>Henüz sipariş yok.</div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 110px 140px 140px 120px",
                gap: 12,
                padding: "12px 16px",
                background: "#0e0e0e",
                borderBottom: "1px solid #222",
                fontSize: 12,
                color: "#888",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <div>Sipariş No</div>
              <div>Müşteri</div>
              <div>Ödeme</div>
              <div>Durum</div>
              <div>Tutar</div>
              <div>Tarih</div>
            </div>
            {(orders ?? []).map((o) => (
              <Link
                key={o.id}
                href={`/admin/siparisler/${o.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 110px 140px 140px 120px",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid #1a1a1a",
                  alignItems: "center",
                  fontSize: 14,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ fontFamily: "monospace", color: "#fff" }}>{o.order_no}</div>
                <div style={{ color: "#aaa", fontSize: 12 }}>{o.user_id?.slice(0, 8)}…</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {o.payment_method === "credit_card" ? "Kart" : o.payment_method === "bank_transfer" ? "Havale" : "—"}
                </div>
                <div>
                  <span style={statusBadgeStyle(o.status)}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <div style={{ fontFamily: "monospace" }}>
                  {Number(o.total ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {o.currency ?? "TRY"}
                </div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("tr-TR") : "—"}
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 14px",
        borderRadius: 16,
        fontSize: 13,
        border: "1px solid",
        borderColor: active ? "#8fa4c0" : "#222",
        background: active ? "#8fa4c018" : "transparent",
        color: active ? "#8fa4c0" : "#888",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function statusBadgeStyle(status: string): React.CSSProperties {
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
  return {
    display: "inline-block",
    padding: "3px 10px",
    background: c.bg,
    color: c.fg,
    fontSize: 11,
    borderRadius: 4,
    fontWeight: 600,
  };
}
