"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı.", success: false };

  const fullName = (formData.get("full_name") as string).trim();
  const phone = (formData.get("phone") as string).trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) return { error: "Profil güncellenemedi.", success: false };
  revalidatePath("/hesabim");
  return { error: null, success: true };
}

export async function updateBillingInfo(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı.", success: false };

  const isCorporate = formData.get("is_corporate") === "true";
  const tcNo = (formData.get("tc_no") as string | null)?.trim() || null;
  const taxNo = (formData.get("tax_no") as string | null)?.trim() || null;
  const taxOffice = (formData.get("tax_office") as string | null)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ is_corporate: isCorporate, tc_no: tcNo, tax_no: taxNo, tax_office: taxOffice })
    .eq("id", user.id);

  if (error) return { error: "Fatura bilgileri güncellenemedi.", success: false };
  revalidatePath("/hesabim/fatura-bilgileri");
  return { error: null, success: true };
}

export async function updatePassword(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı.", success: false };

  const password = (formData.get("password") as string) || "";
  const passwordRepeat = (formData.get("password_repeat") as string) || "";

  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı.", success: false };
  if (password !== passwordRepeat) return { error: "Şifreler eşleşmiyor.", success: false };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Şifre güncellenemedi.", success: false };
  return { error: null, success: true };
}
