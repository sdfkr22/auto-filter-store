"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddressActionResult = { ok: true } | { ok: false; error: string };

function readAddressFields(formData: FormData) {
  return {
    title:        String(formData.get("title") ?? "").trim(),
    full_name:    String(formData.get("full_name") ?? "").trim(),
    phone:        String(formData.get("phone") ?? "").trim(),
    full_address: String(formData.get("full_address") ?? "").trim(),
    city:         String(formData.get("city") ?? "").trim(),
    district:     String(formData.get("district") ?? "").trim(),
    zip:          String(formData.get("zip") ?? "").trim() || null,
  };
}

function validate(a: ReturnType<typeof readAddressFields>): string | null {
  if (!a.title || !a.full_name || !a.phone || !a.full_address || !a.city || !a.district) {
    return "Tüm zorunlu alanları doldurun.";
  }
  return null;
}

export async function createUserAddress(formData: FormData): Promise<AddressActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const fields = readAddressFields(formData);
  const err = validate(fields);
  if (err) return { ok: false, error: err };

  const { error } = await sb.from("addresses").insert({ user_id: user.id, ...fields });
  if (error) return { ok: false, error: "Adres kaydedilemedi." };

  revalidatePath("/hesabim/adreslerim");
  return { ok: true };
}

export async function updateUserAddress(addressId: string, formData: FormData): Promise<AddressActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const fields = readAddressFields(formData);
  const err = validate(fields);
  if (err) return { ok: false, error: err };

  const { error } = await sb
    .from("addresses")
    .update(fields)
    .eq("id", addressId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Adres güncellenemedi." };

  revalidatePath("/hesabim/adreslerim");
  return { ok: true };
}

export async function deleteUserAddress(addressId: string): Promise<AddressActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const { error } = await sb
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Adres silinemedi." };

  revalidatePath("/hesabim/adreslerim");
  return { ok: true };
}

export async function setDefaultAddress(addressId: string): Promise<AddressActionResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  // Önce hepsini false yap, sonra seçileni true (sequential — RLS user_id kapsamında)
  const { error: clearErr } = await sb
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);
  if (clearErr) return { ok: false, error: "Varsayılan adres ayarlanamadı." };

  const { error: setErr } = await sb
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);
  if (setErr) return { ok: false, error: "Varsayılan adres ayarlanamadı." };

  revalidatePath("/hesabim/adreslerim");
  return { ok: true };
}
