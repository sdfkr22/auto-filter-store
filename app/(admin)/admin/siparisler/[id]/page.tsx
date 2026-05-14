import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

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

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;
  const sb = createAdminClient();

  const { data: order } = await sb
    .from("orders")
    .select(`
      id, order_no, status, payment_method, subtotal, shipping_cost, discount_amount, total, currency,
      created_at, updated_at, user_id, iyzico_payment_id, bank_transfer_ref,
      cargo_company, cargo_tracking_no, notes,
      shipping_address:addresses!orders_shipping_address_id_fkey(title, full_name, full_address, city, district, zip, phone),
      billing_address:addresses!orders_billing_address_id_fkey(title, full_name, full_address, city, district, zip, phone),
      shipping_method:shipping_methods(name, company, estimated_days)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: profile }] = await Promise.all([
    sb.from("order_items").select("product_code, product_name, quantity, unit_price, total_price").eq("order_id", id),
    sb.from("profiles").select("full_name, phone").eq("id", order.user_id).maybeSingle(),
  ]);

  const ship = Array.isArray(order.shipping_address) ? order.shipping_address[0] : order.shipping_address;
  const bill = Array.isArray(order.billing_address) ? order.billing_address[0] : order.billing_address;
  const shipMethod = Array.isArray(order.shipping_method) ? order.shipping_method[0] : order.shipping_method;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/siparisler" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          ← Siparişler
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>{order.order_no}</h1>
          <div style={{ fontSize: 12, color: "#888" }}>
            {order.created_at ? new Date(order.created_at).toLocaleString("tr-TR") : "—"}
            {" · "}
            {order.payment_method === "credit_card" ? "Kredi Kartı" : "Havale/EFT"}
          </div>
        </div>
        <span style={statusBadgeStyle(order.status)}>{STATUS_LABELS[order.status] ?? order.status}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div>
          {/* Ürünler */}
          <div style={card}>
            <div style={cardTitle}>Ürünler</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px", gap: 10, fontSize: 12, color: "#888", padding: "0 0 8px", borderBottom: "1px solid #1f1f1f", fontWeight: 600 }}>
              <div>Ürün</div><div style={{ textAlign: "center" }}>Adet</div><div style={{ textAlign: "right" }}>Birim</div><div style={{ textAlign: "right" }}>Toplam</div>
            </div>
            {(items ?? []).map((it, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px", gap: 10, padding: "10px 0", borderBottom: "1px solid #181818", fontSize: 13, alignItems: "center" }}>
                <div>
                  <div style={{ color: "#e5e5e5" }}>{it.product_name}</div>
                  <div style={{ fontFamily: "monospace", color: "#666", fontSize: 11 }}>{it.product_code}</div>
                </div>
                <div style={{ textAlign: "center", color: "#aaa" }}>{it.quantity}</div>
                <div style={{ textAlign: "right", color: "#aaa", fontFamily: "monospace" }}>{fmt(it.unit_price)}</div>
                <div style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(it.total_price)}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{ minWidth: 260 }}>
                <div style={totalsRow}><span>Ara toplam</span><span>{fmt(order.subtotal)}</span></div>
                <div style={totalsRow}><span>Kargo</span><span>{order.shipping_cost === 0 ? "Ücretsiz" : fmt(order.shipping_cost)}</span></div>
                {order.discount_amount > 0 && (
                  <div style={totalsRow}><span>İndirim</span><span style={{ color: "#7ad19a" }}>−{fmt(order.discount_amount)}</span></div>
                )}
                <div style={{ ...totalsRow, borderTop: "1px solid #222", marginTop: 6, paddingTop: 8, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  <span>Toplam</span><span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adresler */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div style={card}>
              <div style={cardTitle}>Teslimat Adresi</div>
              {ship ? (
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600, color: "#e5e5e5" }}>{ship.title}</div>
                  <div>{ship.full_name}</div>
                  <div>{ship.full_address}</div>
                  <div>{ship.district}, {ship.city}{ship.zip ? ` ${ship.zip}` : ""}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{ship.phone}</div>
                </div>
              ) : <div style={{ color: "#666" }}>—</div>}
            </div>
            <div style={card}>
              <div style={cardTitle}>Fatura Adresi</div>
              {bill ? (
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600, color: "#e5e5e5" }}>{bill.title}</div>
                  <div>{bill.full_name}</div>
                  <div>{bill.full_address}</div>
                  <div>{bill.district}, {bill.city}{bill.zip ? ` ${bill.zip}` : ""}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{bill.phone}</div>
                </div>
              ) : <div style={{ color: "#666" }}>—</div>}
            </div>
          </div>

          {/* Müşteri & Kargo */}
          <div style={{ ...card, marginTop: 16 }}>
            <div style={cardTitle}>Müşteri & Kargo</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13, color: "#ccc" }}>
              <div>
                <div style={kvLabel}>Müşteri</div>
                <div>{profile?.full_name ?? "—"}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{profile?.phone ?? ""}</div>
                <div style={{ color: "#666", fontSize: 11, fontFamily: "monospace", marginTop: 4 }}>{order.user_id}</div>
              </div>
              <div>
                <div style={kvLabel}>Kargo Yöntemi</div>
                <div>{shipMethod ? `${shipMethod.company} — ${shipMethod.name}` : "—"}</div>
                {shipMethod?.estimated_days && (
                  <div style={{ color: "#888", fontSize: 12 }}>{shipMethod.estimated_days}</div>
                )}
                {order.cargo_tracking_no && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: "#888" }}>Takip: </span>
                    <span style={{ fontFamily: "monospace", color: "#FFED00" }}>{order.cargo_tracking_no}</span>
                    {order.cargo_company && <span style={{ color: "#888" }}> · {order.cargo_company}</span>}
                  </div>
                )}
              </div>
            </div>
            {(order.iyzico_payment_id || order.bank_transfer_ref || order.notes) && (
              <div style={{ marginTop: 14, padding: "10px 0 0", borderTop: "1px solid #1f1f1f", fontSize: 12, color: "#888" }}>
                {order.iyzico_payment_id && <div>İyzico Payment ID: <span style={{ fontFamily: "monospace", color: "#aaa" }}>{order.iyzico_payment_id}</span></div>}
                {order.bank_transfer_ref && <div>Havale Ref: <span style={{ fontFamily: "monospace", color: "#aaa" }}>{order.bank_transfer_ref}</span></div>}
                {order.notes && <div>Not: <span style={{ color: "#aaa" }}>{order.notes}</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* Sağ panel — aksiyonlar */}
        <OrderActions
          orderId={order.id}
          status={order.status}
          paymentMethod={order.payment_method ?? ""}
          cargoCompany={order.cargo_company ?? ""}
          cargoTrackingNo={order.cargo_tracking_no ?? ""}
        />
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 18,
};
const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#e5e5e5",
  marginBottom: 14,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const totalsRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#aaa",
  padding: "4px 0",
};
const kvLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 4,
};

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
    padding: "6px 14px",
    background: c.bg,
    color: c.fg,
    fontSize: 13,
    borderRadius: 6,
    fontWeight: 600,
  };
}
