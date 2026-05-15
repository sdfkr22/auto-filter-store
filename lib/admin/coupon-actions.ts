"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";

export type AdminCouponResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type CouponPatch = {
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  min_order_amount?: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  active?: boolean;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function parseDateOrNull(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parsePatchFromForm(fd: FormData): { patch: CouponPatch; error?: string } {
  const code = normalizeCode(String(fd.get("code") ?? ""));
  if (!code) return { patch: {}, error: "Kod boş olamaz." };

  const type = String(fd.get("type") ?? "percent");
  if (type !== "percent" && type !== "fixed") return { patch: {}, error: "Tip geçersiz." };

  const value = Number(fd.get("value") ?? 0);
  if (!isFinite(value) || value <= 0) return { patch: {}, error: "Değer 0'dan büyük olmalı." };
  if (type === "percent" && value > 100) return { patch: {}, error: "Yüzde 100'den büyük olamaz." };

  const minOrder = Number(fd.get("min_order_amount") ?? 0);
  if (!isFinite(minOrder) || minOrder < 0) return { patch: {}, error: "Min sipariş tutarı geçersiz." };

  const maxUsesRaw = String(fd.get("max_uses") ?? "").trim();
  const maxUses = maxUsesRaw === "" ? null : Number(maxUsesRaw);
  if (maxUses != null && (!isFinite(maxUses) || maxUses < 1)) {
    return { patch: {}, error: "Kullanım limiti pozitif olmalı." };
  }

  return {
    patch: {
      code,
      type,
      value,
      min_order_amount: minOrder,
      max_uses: maxUses,
      valid_from: parseDateOrNull(fd.get("valid_from")),
      valid_until: parseDateOrNull(fd.get("valid_until")),
      active: fd.get("active") === "true" || fd.get("active") === "on",
    },
  };
}

export async function createCoupon(fd: FormData): Promise<AdminCouponResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz." };

  const { patch, error } = parsePatchFromForm(fd);
  if (error) return { ok: false, error };

  const client = createAdminClient();
  const { data, error: dbErr } = await client
    .from("coupons")
    .insert({
      code: patch.code!,
      type: patch.type!,
      value: patch.value!,
      min_order_amount: patch.min_order_amount ?? 0,
      max_uses: patch.max_uses,
      valid_from: patch.valid_from,
      valid_until: patch.valid_until,
      active: patch.active ?? true,
    })
    .select("id")
    .single();

  if (dbErr) {
    if (dbErr.code === "23505") return { ok: false, error: "Bu kupon kodu zaten var." };
    return { ok: false, error: "Kupon oluşturulamadı." };
  }

  revalidatePath("/admin/kuponlar");
  return { ok: true, id: data.id };
}

export async function updateCoupon(id: string, fd: FormData): Promise<AdminCouponResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz." };

  const { patch, error } = parsePatchFromForm(fd);
  if (error) return { ok: false, error };

  const client = createAdminClient();
  const { error: dbErr } = await client
    .from("coupons")
    .update({
      code: patch.code,
      type: patch.type,
      value: patch.value,
      min_order_amount: patch.min_order_amount,
      max_uses: patch.max_uses,
      valid_from: patch.valid_from,
      valid_until: patch.valid_until,
      active: patch.active,
    })
    .eq("id", id);

  if (dbErr) {
    if (dbErr.code === "23505") return { ok: false, error: "Bu kupon kodu zaten var." };
    return { ok: false, error: "Kupon güncellenemedi." };
  }

  revalidatePath("/admin/kuponlar");
  revalidatePath(`/admin/kuponlar/${id}`);
  return { ok: true, id };
}

export async function toggleCouponActive(id: string, active: boolean): Promise<AdminCouponResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz." };

  const client = createAdminClient();
  const { error } = await client.from("coupons").update({ active }).eq("id", id);
  if (error) return { ok: false, error: "Güncellenemedi." };

  revalidatePath("/admin/kuponlar");
  return { ok: true, id };
}

export async function deleteCoupon(id: string): Promise<AdminCouponResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz." };

  const client = createAdminClient();
  const { error } = await client.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, error: "Kupon silinemedi (siparişlerde kullanılmış olabilir)." };

  revalidatePath("/admin/kuponlar");
  return { ok: true, id };
}
