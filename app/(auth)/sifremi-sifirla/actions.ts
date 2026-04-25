"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(
  _: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (password !== confirm) return { error: "Şifreler eşleşmiyor." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalıdır." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: "Şifre güncellenemedi. Lütfen tekrar deneyin." };
  redirect("/hesabim");
}
