import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveCheckoutForm } from "@/lib/iyzico/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/odeme/hata?reason=${encodeURIComponent(reason)}`, { status: 303 });

  let token: string | null = null;
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "") || null;
  } catch {
    return fail("invalid_callback");
  }
  if (!token) return fail("missing_token");

  const result = await retrieveCheckoutForm(token);
  const admin = createAdminClient();

  if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
    // Eşleşen order'ı bul (conversationId notes alanında)
    if (result.conversationId) {
      const { data: order } = await admin
        .from("orders")
        .select("id")
        .eq("notes", `iyz_conv:${result.conversationId}`)
        .maybeSingle();
      if (order) {
        const { data: items } = await admin
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", order.id);
        if (items && items.length > 0) {
          await admin.rpc("release_order_reservation", {
            p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          });
        }
        await admin
          .from("orders")
          .update({ status: "cancelled", notes: `iyz_fail: ${result.errorMessage ?? result.errorCode ?? "unknown"}` })
          .eq("id", order.id);
      }
    }
    return fail(result.errorMessage || result.errorCode || "payment_failed");
  }

  // Başarılı — order'ı bul, stok düş, paid yap, sepeti temizle
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, order_no")
    .eq("order_no", result.basketId ?? "")
    .maybeSingle();

  if (!order) return fail("order_not_found");

  const { data: items } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    const { error: stockErr } = await admin.rpc("finalize_order_stock", {
      p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    });
    if (stockErr) {
      // Ödeme alındı ama stok düşülemedi — admin'in elle çözmesi için failed_stock olarak işaretle
      await admin
        .from("orders")
        .update({
          status: "paid",
          iyzico_payment_id: result.paymentId ?? null,
          notes: `iyz_paid_stock_fail: ${stockErr.message}`,
        })
        .eq("id", order.id);
      return NextResponse.redirect(`${origin}/odeme/basarili/${order.id}`, { status: 303 });
    }
  }

  await admin
    .from("orders")
    .update({
      status: "paid",
      iyzico_payment_id: result.paymentId ?? null,
      notes: null,
    })
    .eq("id", order.id);

  // Kullanıcının sepetini boşalt
  await admin.from("cart_items").delete().eq("user_id", order.user_id);

  return NextResponse.redirect(`${origin}/odeme/basarili/${order.id}`, { status: 303 });
}
