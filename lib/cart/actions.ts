"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CartActionResult =
  | { ok: true }
  | { ok: false; error: "AUTH_REQUIRED" | "INVALID_QUANTITY" | "OUT_OF_STOCK" | "PRODUCT_NOT_FOUND" | "NOT_IN_CART" | "DB_ERROR" };

export type CartItem = {
  productId: string;
  productName: string;
  productFancyName: string | null;
  productType: string;
  imageUrl: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  quantity: number;
};

// reserved_stock güncellemesi servis-rol gerektiriyor (RLS yalnızca okuma izniyle).
// Sequential read-modify-write — race condition için TODO: postgres function ile atomic yap.
async function adjustReservedStock(productId: string, delta: number) {
  if (delta === 0) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("reserved_stock")
    .eq("id", productId)
    .single();
  if (!data) return;
  const next = Math.max(0, (data.reserved_stock ?? 0) + delta);
  await admin.from("products").update({ reserved_stock: next }).eq("id", productId);
}

export async function addToCart(productId: string, quantity: number = 1): Promise<CartActionResult> {
  if (quantity < 1) return { ok: false, error: "INVALID_QUANTITY" };

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const { data: product } = await sb
    .from("products")
    .select("stock, active")
    .eq("id", productId)
    .single();
  if (!product || !product.active) return { ok: false, error: "PRODUCT_NOT_FOUND" };

  const { data: existing } = await sb
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) return { ok: false, error: "OUT_OF_STOCK" };

  const dbResult = existing
    ? await sb.from("cart_items").update({ quantity: newQty }).eq("id", existing.id)
    : await sb.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: newQty });
  if (dbResult.error) return { ok: false, error: "DB_ERROR" };

  await adjustReservedStock(productId, quantity);
  revalidatePath("/sepet");
  return { ok: true };
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<CartActionResult> {
  if (quantity < 0) return { ok: false, error: "INVALID_QUANTITY" };

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const { data: existing } = await sb
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "NOT_IN_CART" };

  const delta = quantity - existing.quantity;

  if (quantity === 0) {
    const { error } = await sb.from("cart_items").delete().eq("id", existing.id);
    if (error) return { ok: false, error: "DB_ERROR" };
  } else {
    const { data: product } = await sb.from("products").select("stock").eq("id", productId).single();
    if (!product) return { ok: false, error: "PRODUCT_NOT_FOUND" };
    if (quantity > product.stock) return { ok: false, error: "OUT_OF_STOCK" };
    const { error } = await sb.from("cart_items").update({ quantity }).eq("id", existing.id);
    if (error) return { ok: false, error: "DB_ERROR" };
  }

  await adjustReservedStock(productId, delta);
  revalidatePath("/sepet");
  return { ok: true };
}

export async function removeFromCart(productId: string): Promise<CartActionResult> {
  return updateCartQuantity(productId, 0);
}

type RawCartRow = {
  quantity: number;
  products: {
    id: string;
    product_name: string;
    product_fancy_name: string | null;
    product_type: string;
    image_url: string | null;
    price: number;
    compare_price: number | null;
    stock: number;
  } | null;
};

export async function getCart(): Promise<CartItem[]> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data } = await sb
    .from("cart_items")
    .select("quantity, products(id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock)")
    .eq("user_id", user.id);

  const rows = (data ?? []) as unknown as RawCartRow[];
  return rows
    .filter((r) => r.products !== null)
    .map((r) => ({
      productId:        r.products!.id,
      productName:      r.products!.product_name,
      productFancyName: r.products!.product_fancy_name,
      productType:      r.products!.product_type,
      imageUrl:         r.products!.image_url,
      price:            r.products!.price,
      comparePrice:     r.products!.compare_price,
      stock:            r.products!.stock,
      quantity:         r.quantity,
    }));
}

export async function mergeGuestCart(items: { productId: string; quantity: number }[]): Promise<CartActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  for (const item of items) {
    if (item.quantity < 1) continue;
    await addToCart(item.productId, item.quantity);
  }
  return { ok: true };
}
