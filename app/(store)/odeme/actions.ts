"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NewAddressResult =
  | { ok: true; addressId: string }
  | { ok: false; error: string };

export async function createAddress(formData: FormData): Promise<NewAddressResult> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmanız gerekiyor." };

  const title        = String(formData.get("title") ?? "").trim();
  const full_name    = String(formData.get("full_name") ?? "").trim();
  const phone        = String(formData.get("phone") ?? "").trim();
  const full_address = String(formData.get("full_address") ?? "").trim();
  const city         = String(formData.get("city") ?? "").trim();
  const district     = String(formData.get("district") ?? "").trim();
  const zip          = String(formData.get("zip") ?? "").trim() || null;
  const is_billing   = formData.get("is_billing") === "true";

  if (!title || !full_name || !phone || !full_address || !city || !district) {
    return { ok: false, error: "Tüm zorunlu alanları doldurun." };
  }

  const { data, error } = await sb
    .from("addresses")
    .insert({ user_id: user.id, title, full_name, phone, full_address, city, district, zip, is_billing })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Adres kaydedilemedi." };

  revalidatePath("/odeme");
  revalidatePath("/hesabim/adreslerim");
  return { ok: true, addressId: data.id };
}
