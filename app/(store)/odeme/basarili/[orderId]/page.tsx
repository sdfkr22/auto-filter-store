import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Siparişiniz Alındı" };

const fmt = (n: number) => `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Params = Promise<{ orderId: string }>;

export default async function OdemeBasariliPage({ params }: { params: Params }) {
  const { orderId } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris");

  const { data: order } = await sb
    .from("orders")
    .select(`
      id, order_no, status, payment_method, subtotal, shipping_cost, total, created_at,
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

  const isBankTransfer = order.payment_method === "bank_transfer";
  const addr = Array.isArray(order.shipping_address) ? order.shipping_address[0] : order.shipping_address;
  const shippingMethod = Array.isArray(order.shipping_method) ? order.shipping_method[0] : order.shipping_method;

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            {isBankTransfer ? "Siparişiniz alındı" : "Ödemeniz başarıyla alındı"}
          </h1>
          <div style={{ fontSize: 14, color: "#aaa" }}>
            Sipariş No: <span style={{ color: "#FFED00", fontWeight: 600 }}>{order.order_no}</span>
          </div>
        </div>

        {isBankTransfer && (
          <div style={{ background: "#1a1612", border: "1px solid #3a2f1a", borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e5b04b", marginBottom: 10 }}>Havale/EFT Bilgileri</div>
            <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.8 }}>
              <div>Banka: <strong>[Banka Adı — TBD]</strong></div>
              <div>IBAN: <span style={{ fontFamily: "monospace" }}>TR00 0000 0000 0000 0000 0000 00</span></div>
              <div>Alıcı: <strong>auto-filter Ltd.</strong></div>
              <div style={{ marginTop: 8, color: "#aaa" }}>
                Açıklama alanına <strong style={{ color: "#FFED00" }}>{order.order_no}</strong> yazmayı unutmayın.
                Ödemeniz onaylanınca siparişiniz hazırlanmaya başlar.
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12, padding: 22, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Sipariş Detayı</div>
          {(items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ccc", padding: "6px 0", borderBottom: "1px solid #181818" }}>
              <span>{it.product_name} <span style={{ color: "#666" }}>× {it.quantity}</span></span>
              <span>{fmt(it.total_price)}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 13, color: "#aaa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Ara toplam</span><span>{fmt(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Kargo</span><span>{order.shipping_cost === 0 ? "Ücretsiz" : fmt(order.shipping_cost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #1a1a1a", marginTop: 6, fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>
              <span>Toplam</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {addr && (
          <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12, padding: 22, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Teslimat Adresi</div>
            <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
              <div>{addr.full_name}</div>
              <div>{addr.full_address}</div>
              <div>{addr.district}, {addr.city}{addr.zip ? ` ${addr.zip}` : ""}</div>
              <div>{addr.phone}</div>
              {shippingMethod && (
                <div style={{ marginTop: 8, color: "#888" }}>
                  Kargo: {shippingMethod.company}{shippingMethod.estimated_days ? ` — ${shippingMethod.estimated_days}` : ""}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "center" }}>
          <Link href="/hesabim" style={{ background: "#FFED00", color: "#0a0a0a", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Hesabıma Git
          </Link>
          <Link href="/urunler" style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 8, padding: "11px 22px", fontSize: 14, textDecoration: "none" }}>
            Alışverişe Devam
          </Link>
        </div>
      </main>
    </div>
  );
}
