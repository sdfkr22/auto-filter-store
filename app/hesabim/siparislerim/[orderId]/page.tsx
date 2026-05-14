import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sipariş Detayı" };

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

type Params = Promise<{ orderId: string }>;

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  header: { borderBottom: "1px solid #1a1a1a", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 } as const,
  back: { fontSize: 13, color: "#888", textDecoration: "none" } as const,
  sep: { color: "#333", fontSize: 13 } as const,
  pageTitle: { fontSize: 13, color: "#e5e5e5" } as const,
  main: { maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" } as const,
  card: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 20, marginBottom: 16 } as const,
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#e5e5e5", marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: 0.5 },
};

export default async function SiparisDetayPage({ params }: { params: Params }) {
  const { orderId } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris");

  const { data: order } = await sb
    .from("orders")
    .select(`
      id, order_no, status, payment_method, subtotal, shipping_cost, discount_amount, total, currency,
      created_at, cargo_company, cargo_tracking_no, bank_transfer_ref,
      shipping_address:addresses!orders_shipping_address_id_fkey(title, full_name, full_address, city, district, phone, zip),
      shipping_method:shipping_methods(name, company, estimated_days)
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await sb
    .from("order_items")
    .select("product_code, product_name, quantity, unit_price, total_price")
    .eq("order_id", orderId);

  const addr = Array.isArray(order.shipping_address) ? order.shipping_address[0] : order.shipping_address;
  const shipMethod = Array.isArray(order.shipping_method) ? order.shipping_method[0] : order.shipping_method;
  const isBankTransfer = order.payment_method === "bank_transfer";
  const awaitingPayment = order.status === "awaiting_payment";

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Link href="/hesabim" style={s.back}>Hesabım</Link>
        <span style={s.sep}>/</span>
        <Link href="/hesabim/siparislerim" style={s.back}>Siparişlerim</Link>
        <span style={s.sep}>/</span>
        <span style={s.pageTitle}>{order.order_no}</span>
      </header>

      <main style={s.main}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{order.order_no}</h1>
            <div style={{ fontSize: 12, color: "#888" }}>
              {order.created_at ? new Date(order.created_at).toLocaleString("tr-TR") : "—"} · {isBankTransfer ? "Havale/EFT" : "Kredi Kartı"}
            </div>
          </div>
          <span style={statusBadge(order.status)}>{STATUS_LABELS[order.status] ?? order.status}</span>
        </div>

        {/* Havale bekleyenler için IBAN uyarısı */}
        {awaitingPayment && isBankTransfer && (
          <div style={{ background: "#1a1612", border: "1px solid #3a2f1a", borderRadius: 10, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e5b04b", marginBottom: 10 }}>Havale Bekleniyor</div>
            <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
              <div>Banka: <strong>[Banka Adı — TBD]</strong></div>
              <div>IBAN: <span style={{ fontFamily: "monospace" }}>TR00 0000 0000 0000 0000 0000 00</span></div>
              <div>Alıcı: <strong>auto-filter Ltd.</strong></div>
              <div style={{ marginTop: 6, color: "#aaa" }}>
                Açıklama alanına <strong style={{ color: "#FFED00" }}>{order.order_no}</strong> yazmayı unutmayın.
              </div>
            </div>
          </div>
        )}

        {/* Kargo takip */}
        {order.cargo_tracking_no && (
          <div style={{ background: "#0e1a2a", border: "1px solid #1e3a5a", borderRadius: 10, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7a9ad1", marginBottom: 8 }}>Kargo Bilgisi</div>
            <div style={{ fontSize: 13, color: "#ccc" }}>
              {order.cargo_company && <div>Firma: <strong>{order.cargo_company}</strong></div>}
              <div>Takip No: <span style={{ fontFamily: "monospace", color: "#FFED00" }}>{order.cargo_tracking_no}</span></div>
            </div>
          </div>
        )}

        {/* Ürünler */}
        <div style={s.card}>
          <div style={s.cardTitle}>Ürünler</div>
          {(items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 100px", gap: 10, padding: "10px 0", borderBottom: "1px solid #181818", fontSize: 13, alignItems: "center" }}>
              <div>
                <div style={{ color: "#e5e5e5" }}>{it.product_name}</div>
                <div style={{ fontFamily: "monospace", color: "#666", fontSize: 11 }}>{it.product_code}</div>
              </div>
              <div style={{ textAlign: "center", color: "#aaa" }}>× {it.quantity}</div>
              <div style={{ textAlign: "right", color: "#888", fontSize: 12 }}>{fmt(it.unit_price)}</div>
              <div style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(it.total_price)}</div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 13, color: "#aaa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Ara toplam</span><span>{fmt(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Kargo</span><span>{order.shipping_cost === 0 ? "Ücretsiz" : fmt(order.shipping_cost)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>İndirim</span><span style={{ color: "#7ad19a" }}>−{fmt(order.discount_amount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #1a1a1a", marginTop: 6, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              <span>Toplam</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Teslimat */}
        {addr && (
          <div style={s.card}>
            <div style={s.cardTitle}>Teslimat Adresi</div>
            <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, color: "#e5e5e5" }}>{addr.title}</div>
              <div>{addr.full_name}</div>
              <div>{addr.full_address}</div>
              <div>{addr.district}, {addr.city}{addr.zip ? ` ${addr.zip}` : ""}</div>
              <div style={{ color: "#888", fontSize: 12 }}>{addr.phone}</div>
              {shipMethod && (
                <div style={{ marginTop: 10, color: "#888", fontSize: 12 }}>
                  Kargo: {shipMethod.company}{shipMethod.estimated_days ? ` — ${shipMethod.estimated_days}` : ""}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Link href="/hesabim/siparislerim" style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 8, padding: "10px 18px", fontSize: 13, textDecoration: "none" }}>
            ← Siparişlere Dön
          </Link>
          <Link href="/iletisim" style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 8, padding: "10px 18px", fontSize: 13, textDecoration: "none" }}>
            Yardım & İletişim
          </Link>
        </div>
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
  return { display: "inline-block", padding: "6px 14px", background: c.bg, color: c.fg, fontSize: 13, borderRadius: 6, fontWeight: 600 };
}
