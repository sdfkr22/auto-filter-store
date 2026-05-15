"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCart } from "@/lib/cart/actions";
import { validateCoupon } from "@/lib/coupon/actions";
import { createCheckoutForm, type BasketItem } from "@/lib/iyzico/client";

export type InitiateCardPaymentInput = {
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethodId: string;
  couponCode?: string;
};

async function incrementCouponUsage(couponId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("used_count").eq("id", couponId).single();
  if (!data) return;
  await admin.from("coupons").update({ used_count: (data.used_count ?? 0) + 1 }).eq("id", couponId);
}

export type InitiateCardPaymentResult =
  | { ok: true; orderId: string; paymentPageUrl: string; token: string }
  | { ok: false; error: string };

export type InitiateBankTransferResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function initiateBankTransfer(input: InitiateCardPaymentInput): Promise<InitiateBankTransferResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const cart = await getCart();
  if (cart.length === 0) return { ok: false, error: "Sepetiniz boş." };

  const [addressesRes, shippingRes] = await Promise.all([
    sb.from("addresses").select("id").eq("user_id", user.id).in("id", [input.shippingAddressId, input.billingAddressId]),
    sb.from("shipping_methods").select("price, free_above").eq("id", input.shippingMethodId).eq("active", true).single(),
  ]);

  const hasShipping = addressesRes.data?.some((a) => a.id === input.shippingAddressId);
  const hasBilling = addressesRes.data?.some((a) => a.id === input.billingAddressId);
  if (!hasShipping || !hasBilling) return { ok: false, error: "Adres bulunamadı." };
  if (!shippingRes.data) return { ok: false, error: "Kargo yöntemi bulunamadı." };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost =
    shippingRes.data.free_above != null && subtotal >= shippingRes.data.free_above ? 0 : shippingRes.data.price;

  let couponId: string | null = null;
  let discount = 0;
  if (input.couponCode) {
    const cv = await validateCoupon(input.couponCode, subtotal);
    if (!cv.ok) return { ok: false, error: cv.error };
    couponId = cv.coupon.id;
    discount = cv.discount;
  }
  const total = Math.max(0, subtotal + shippingCost - discount);

  const admin = createAdminClient();

  const { data: orderNoRow, error: noErr } = await admin.rpc("generate_order_no");
  if (noErr || !orderNoRow) return { ok: false, error: "Sipariş numarası üretilemedi." };
  const orderNo = orderNoRow as unknown as string;

  const { data: orderRow, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_no: orderNo,
      user_id: user.id,
      status: "awaiting_payment",
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discount,
      total,
      currency: "TRY",
      locale: "tr",
      shipping_method_id: input.shippingMethodId,
      shipping_address_id: input.shippingAddressId,
      billing_address_id: input.billingAddressId,
      coupon_id: couponId,
      payment_method: "bank_transfer",
    })
    .select("id")
    .single();

  if (orderErr || !orderRow) return { ok: false, error: "Sipariş oluşturulamadı." };

  const orderId = orderRow.id;

  const orderItemsPayload = cart.map((i) => ({
    order_id: orderId,
    product_id: i.productId,
    product_code: i.productName,
    product_name: i.productFancyName ?? i.productName,
    quantity: i.quantity,
    unit_price: i.price,
    total_price: i.price * i.quantity,
  }));

  const { error: itemsErr } = await admin.from("order_items").insert(orderItemsPayload);
  if (itemsErr) return { ok: false, error: "Sipariş kalemleri kaydedilemedi." };

  // Havale akışında stok rezerve kalır (admin havale onayında finalize_order_stock çağıracak).
  // Sepeti boşalt — kullanıcı havale beklediği için aynı ürünleri yeniden sipariş etmemeli.
  await admin.from("cart_items").delete().eq("user_id", user.id);

  if (couponId) await incrementCouponUsage(couponId);

  return { ok: true, orderId };
}

export async function initiateCardPayment(input: InitiateCardPaymentInput): Promise<InitiateCardPaymentResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const cart = await getCart();
  if (cart.length === 0) return { ok: false, error: "Sepetiniz boş." };

  const [addressesRes, shippingRes, profileRes] = await Promise.all([
    sb.from("addresses").select("*").eq("user_id", user.id).in("id", [input.shippingAddressId, input.billingAddressId]),
    sb.from("shipping_methods").select("*").eq("id", input.shippingMethodId).eq("active", true).single(),
    sb.from("profiles").select("full_name, phone").eq("id", user.id).single(),
  ]);

  const shippingAddress = addressesRes.data?.find((a) => a.id === input.shippingAddressId);
  const billingAddress = addressesRes.data?.find((a) => a.id === input.billingAddressId) ?? shippingAddress;
  const shipping = shippingRes.data;

  if (!shippingAddress || !billingAddress) return { ok: false, error: "Adres bulunamadı." };
  if (!shipping) return { ok: false, error: "Kargo yöntemi bulunamadı." };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost =
    shipping.free_above != null && subtotal >= shipping.free_above ? 0 : shipping.price;

  let couponId: string | null = null;
  let discount = 0;
  if (input.couponCode) {
    const cv = await validateCoupon(input.couponCode, subtotal);
    if (!cv.ok) return { ok: false, error: cv.error };
    couponId = cv.coupon.id;
    discount = cv.discount;
  }
  const total = Math.max(0, subtotal + shippingCost - discount);

  const admin = createAdminClient();

  const { data: orderNoRow, error: noErr } = await admin.rpc("generate_order_no");
  if (noErr || !orderNoRow) return { ok: false, error: "Sipariş numarası üretilemedi." };
  const orderNo = orderNoRow as unknown as string;

  const { data: orderRow, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_no: orderNo,
      user_id: user.id,
      status: "pending",
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discount,
      total,
      currency: "TRY",
      locale: "tr",
      shipping_method_id: input.shippingMethodId,
      shipping_address_id: input.shippingAddressId,
      billing_address_id: input.billingAddressId,
      coupon_id: couponId,
      payment_method: "credit_card",
    })
    .select("id")
    .single();

  if (orderErr || !orderRow) return { ok: false, error: "Sipariş oluşturulamadı." };

  const orderId = orderRow.id;

  const orderItemsPayload = cart.map((i) => ({
    order_id: orderId,
    product_id: i.productId,
    product_code: i.productName,
    product_name: i.productFancyName ?? i.productName,
    quantity: i.quantity,
    unit_price: i.price,
    total_price: i.price * i.quantity,
  }));

  const { error: itemsErr } = await admin.from("order_items").insert(orderItemsPayload);
  if (itemsErr) return { ok: false, error: "Sipariş kalemleri kaydedilemedi." };

  // Iyzico basketItems toplamı `price` ile birebir eşleşmek zorunda; küsuratta sapma olmasın diye
  // son kalemi total - diğer kalemler farkına ayarlıyoruz.
  const basketItems: BasketItem[] = cart.map((i) => ({
    id: i.productId,
    name: (i.productFancyName ?? i.productName).slice(0, 250),
    category1: i.productType || "Filtre",
    itemType: "PHYSICAL",
    price: (i.price * i.quantity).toFixed(2),
  }));

  // küsurat düzeltme: subtotal'in basketItems toplamına eşit olduğundan emin ol
  const itemsSum = basketItems.reduce((s, b) => s + Number(b.price), 0);
  const diff = +(subtotal - itemsSum).toFixed(2);
  if (Math.abs(diff) > 0.001 && basketItems.length > 0) {
    const last = basketItems[basketItems.length - 1];
    last.price = (Number(last.price) + diff).toFixed(2);
  }

  const hdrs = await headers();
  const xff = hdrs.get("x-forwarded-for") ?? "";
  const buyerIp = xff.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "85.34.78.112";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? hdrs.get("origin") ?? "http://localhost:3000";

  const [firstName, ...rest] = (profileRes.data?.full_name ?? shippingAddress.full_name).split(" ");
  const lastName = rest.join(" ") || firstName;

  const conversationId = randomUUID();

  // conversationId'i orders'a yazalım ki callback'te eşleştirelim
  await admin.from("orders").update({ notes: `iyz_conv:${conversationId}` }).eq("id", orderId);

  const iyzRes = await createCheckoutForm({
    locale: "tr",
    conversationId,
    price: subtotal.toFixed(2),
    paidPrice: total.toFixed(2),
    currency: "TRY",
    basketId: orderNo,
    paymentGroup: "PRODUCT",
    callbackUrl: `${siteUrl}/api/payment/callback`,
    buyer: {
      id: user.id,
      name: firstName || "Müşteri",
      surname: lastName,
      gsmNumber: (profileRes.data?.phone ?? shippingAddress.phone).replace(/\s/g, ""),
      email: user.email ?? "no-reply@auto-filter.com",
      identityNumber: "11111111111",
      registrationAddress: shippingAddress.full_address,
      ip: buyerIp,
      city: shippingAddress.city,
      country: "Turkey",
      zipCode: shippingAddress.zip ?? undefined,
    },
    shippingAddress: {
      contactName: shippingAddress.full_name,
      city: shippingAddress.city,
      country: "Turkey",
      address: shippingAddress.full_address,
      zipCode: shippingAddress.zip ?? undefined,
    },
    billingAddress: {
      contactName: billingAddress.full_name,
      city: billingAddress.city,
      country: "Turkey",
      address: billingAddress.full_address,
      zipCode: billingAddress.zip ?? undefined,
    },
    basketItems,
  });

  if (iyzRes.status !== "success" || !iyzRes.paymentPageUrl || !iyzRes.token) {
    await admin.from("orders").update({ status: "cancelled", notes: `iyz_init_fail: ${iyzRes.errorMessage ?? iyzRes.errorCode ?? "unknown"}` }).eq("id", orderId);
    return { ok: false, error: iyzRes.errorMessage || "Ödeme başlatılamadı." };
  }

  return { ok: true, orderId, paymentPageUrl: iyzRes.paymentPageUrl, token: iyzRes.token };
}
