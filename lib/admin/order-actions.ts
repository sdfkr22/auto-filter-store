"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";

export type OrderActionResult =
  | { ok: true }
  | { ok: false; error: string };

const VALID_STATUSES = new Set([
  "pending",
  "awaiting_payment",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

function invalidate(orderId: string) {
  revalidatePath("/admin/siparisler");
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/hesabim");
}

async function getOrderItems(orderId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);
  return (data ?? [])
    .filter((i): i is { product_id: string; quantity: number } => i.product_id != null)
    .map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
}

// Genel durum güncelleme: stok etkilemeyen geçişler için (preparing → shipped vb).
export async function updateOrderStatus(orderId: string, nextStatus: string): Promise<OrderActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetki yok." };
  if (!VALID_STATUSES.has(nextStatus)) return { ok: false, error: "Geçersiz durum." };

  // Stok mantığı gerektiren geçişleri özel action'lara zorla
  if (nextStatus === "cancelled" || nextStatus === "refunded") {
    return { ok: false, error: "Bu geçiş için iptal/iade action'ı kullanın." };
  }

  const sb = createAdminClient();
  const { data: current } = await sb.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (!current) return { ok: false, error: "Sipariş bulunamadı." };

  // Havalede paid'e geçiş confirmBankTransfer üzerinden olmalı (stok finalize için)
  if (current.status === "awaiting_payment" && nextStatus === "paid") {
    return { ok: false, error: "Havale ödemesi için 'Havaleyi Onayla' kullanın." };
  }

  const { error } = await sb
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Veritabanı hatası." };

  invalidate(orderId);
  return { ok: true };
}

// Havale onayı: awaiting_payment → paid + stok finalize + referans no kaydet
export async function confirmBankTransfer(orderId: string, bankRef: string): Promise<OrderActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetki yok." };
  const ref = bankRef.trim();
  if (!ref) return { ok: false, error: "Referans no boş olamaz." };

  const sb = createAdminClient();
  const { data: order } = await sb
    .from("orders")
    .select("status, payment_method")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };
  if (order.payment_method !== "bank_transfer") return { ok: false, error: "Sipariş havale yöntemiyle oluşturulmamış." };
  if (order.status !== "awaiting_payment") return { ok: false, error: `Bu durumdaki sipariş onaylanamaz: ${order.status}` };

  const items = await getOrderItems(orderId);
  if (items.length > 0) {
    const { error: stockErr } = await sb.rpc("finalize_order_stock", { p_items: items });
    if (stockErr) return { ok: false, error: `Stok düşülemedi: ${stockErr.message}` };
  }

  const { error } = await sb
    .from("orders")
    .update({
      status: "paid",
      bank_transfer_ref: ref,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Veritabanı hatası." };

  invalidate(orderId);
  return { ok: true };
}

// Sipariş iptal: durumuna göre rezervasyonu serbest bırak veya stok geri ekle
export async function cancelOrder(orderId: string): Promise<OrderActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetki yok." };

  const sb = createAdminClient();
  const { data: order } = await sb
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };
  if (order.status === "cancelled" || order.status === "refunded") {
    return { ok: false, error: "Sipariş zaten iptal/iade durumunda." };
  }
  if (order.status === "delivered") {
    return { ok: false, error: "Teslim edilen sipariş için iade akışı kullanılmalı." };
  }

  const items = await getOrderItems(orderId);

  // pending / awaiting_payment → sadece rezervasyon serbest
  // paid / preparing / shipped → stok geri ekle (finalize edilmişti)
  if (items.length > 0) {
    if (order.status === "pending" || order.status === "awaiting_payment") {
      const { error: rErr } = await sb.rpc("release_order_reservation", { p_items: items });
      if (rErr) return { ok: false, error: `Rezervasyon serbest bırakılamadı: ${rErr.message}` };
    } else {
      // Stok finalize edilmişti — geri ekle (manuel update)
      for (const it of items) {
        const { data: prod } = await sb.from("products").select("stock").eq("id", it.product_id).maybeSingle();
        if (prod) {
          await sb
            .from("products")
            .update({ stock: prod.stock + it.quantity })
            .eq("id", it.product_id);
        }
      }
    }
  }

  const { error } = await sb
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Veritabanı hatası." };

  invalidate(orderId);
  return { ok: true };
}

// Kargo takip no gir + duruma "shipped" geçir
export async function setCargoTracking(
  orderId: string,
  cargoCompany: string,
  trackingNo: string,
): Promise<OrderActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetki yok." };
  const company = cargoCompany.trim();
  const no = trackingNo.trim();
  if (!company || !no) return { ok: false, error: "Kargo firması ve takip no zorunlu." };

  const sb = createAdminClient();
  const { data: order } = await sb.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };
  if (!["paid", "preparing", "shipped"].includes(order.status)) {
    return { ok: false, error: `Bu durumdaki sipariş kargoya verilemez: ${order.status}` };
  }

  const { error } = await sb
    .from("orders")
    .update({
      cargo_company: company,
      cargo_tracking_no: no,
      status: "shipped",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Veritabanı hatası." };

  invalidate(orderId);
  return { ok: true };
}
