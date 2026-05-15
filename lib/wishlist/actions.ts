"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WishlistActionResult =
  | { ok: true; inWishlist: boolean }
  | { ok: false; error: "AUTH_REQUIRED" | "PRODUCT_NOT_FOUND" | "DB_ERROR" };

export type WishlistItem = {
  productId: string;
  productName: string;
  productFancyName: string | null;
  productType: string;
  imageUrl: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
};

export async function addToWishlist(productId: string): Promise<WishlistActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const { data: product } = await sb
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();
  if (!product) return { ok: false, error: "PRODUCT_NOT_FOUND" };

  const { error } = await sb
    .from("wishlists")
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });
  if (error) return { ok: false, error: "DB_ERROR" };

  revalidatePath("/hesabim/favoriler");
  return { ok: true, inWishlist: true };
}

export async function removeFromWishlist(productId: string): Promise<WishlistActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const { error } = await sb
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);
  if (error) return { ok: false, error: "DB_ERROR" };

  revalidatePath("/hesabim/favoriler");
  return { ok: true, inWishlist: false };
}

export async function toggleWishlist(productId: string): Promise<WishlistActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const { data: existing } = await sb
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  return existing ? removeFromWishlist(productId) : addToWishlist(productId);
}

export async function getWishlistIds(): Promise<string[]> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data } = await sb
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.product_id);
}

type RawWishlistRow = {
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

export async function getWishlist(): Promise<WishlistItem[]> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data } = await sb
    .from("wishlists")
    .select("created_at, products(id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as RawWishlistRow[];
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
    }));
}
