"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCart } from "@/lib/cart/actions";

export type CouponInfo = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
};

export type CouponValidation =
  | { ok: true; coupon: CouponInfo; discount: number }
  | { ok: false; error: string };

function calcDiscount(coupon: CouponInfo, subtotal: number): number {
  if (coupon.type === "percent") {
    return Math.min(subtotal, +(subtotal * (coupon.value / 100)).toFixed(2));
  }
  return Math.min(subtotal, coupon.value);
}

// Tek satırda kupon getir + tüm kontroller. Subtotal bilinmiyorsa min_order_amount kontrolü atlanır.
export async function validateCoupon(rawCode: string, subtotal?: number): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Kupon kodu girin." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_until, active")
    .ilike("code", code)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Geçersiz kupon kodu." };
  if (!data.active) return { ok: false, error: "Bu kupon artık geçerli değil." };

  const now = Date.now();
  if (data.valid_from && new Date(data.valid_from).getTime() > now) {
    return { ok: false, error: "Kupon henüz başlamadı." };
  }
  if (data.valid_until && new Date(data.valid_until).getTime() < now) {
    return { ok: false, error: "Kupon süresi dolmuş." };
  }
  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return { ok: false, error: "Kupon kullanım limiti dolmuş." };
  }

  const coupon: CouponInfo = {
    id: data.id,
    code: data.code,
    type: data.type as "percent" | "fixed",
    value: Number(data.value),
    minOrderAmount: Number(data.min_order_amount ?? 0),
  };

  if (subtotal != null && subtotal < coupon.minOrderAmount) {
    return {
      ok: false,
      error: `Minimum sipariş tutarı ₺${coupon.minOrderAmount.toLocaleString("tr-TR")}.`,
    };
  }

  const discount = subtotal != null ? calcDiscount(coupon, subtotal) : 0;
  return { ok: true, coupon, discount };
}

// Sepetin gerçek subtotal'ı ile kupon dene — UI'da apply butonu için
export async function validateCouponForCart(rawCode: string): Promise<CouponValidation> {
  const cart = await getCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return validateCoupon(rawCode, subtotal);
}
