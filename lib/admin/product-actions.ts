"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "DB_ERROR" | "NOT_FOUND" };

export type ProductPatch = {
  price?: number | null;
  compare_price?: number | null;
  stock?: number;
  active?: boolean;
  featured?: boolean;
  label?: string | null;
  image_url?: string | null;
  description_tr?: string | null;
  description_en?: string | null;
  meta_title_tr?: string | null;
  meta_desc_tr?: string | null;
  meta_title_en?: string | null;
  meta_desc_en?: string | null;
};

function invalidateProductCaches(productName?: string) {
  revalidateTag("products", "max");
  revalidatePath("/urunler");
  revalidatePath("/");
  if (productName) revalidatePath(`/urun/${encodeURIComponent(productName)}`);
}

export async function updateProduct(id: string, patch: ProductPatch): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "FORBIDDEN" };

  if (patch.price != null && patch.price < 0) return { ok: false, error: "INVALID_INPUT" };
  if (patch.compare_price != null && patch.compare_price < 0) return { ok: false, error: "INVALID_INPUT" };
  if (patch.stock != null && patch.stock < 0) return { ok: false, error: "INVALID_INPUT" };

  const sb = createAdminClient();
  const { data: existing } = await sb.from("products").select("product_name").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  const { error } = await sb
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "DB_ERROR" };

  invalidateProductCaches(existing.product_name);
  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${id}`);
  return { ok: true };
}

export async function toggleProductActive(id: string, active: boolean): Promise<AdminActionResult> {
  return updateProduct(id, { active });
}

export type BulkPatch = {
  price?: number;
  stock?: number;
  active?: boolean;
};

export async function bulkUpdateProducts(ids: string[], patch: BulkPatch): Promise<AdminActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "FORBIDDEN" };
  if (ids.length === 0) return { ok: false, error: "INVALID_INPUT" };
  if (patch.price != null && patch.price < 0) return { ok: false, error: "INVALID_INPUT" };
  if (patch.stock != null && patch.stock < 0) return { ok: false, error: "INVALID_INPUT" };

  const sb = createAdminClient();
  const { error } = await sb
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) return { ok: false, error: "DB_ERROR" };

  invalidateProductCaches();
  revalidatePath("/admin/urunler");
  return { ok: true };
}
