"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function translateError(msg: string): string {
  if (msg.includes("already registered") || msg.includes("already been registered")) return "Bu e-posta adresi zaten kayıtlı.";
  if (msg.includes("Password should be")) return "Şifre en az 6 karakter olmalıdır.";
  if (msg.includes("too many requests")) return "Çok fazla deneme. Lütfen bekleyin.";
  return "Kayıt oluşturulamadı. Lütfen tekrar deneyin.";
}

export async function signUp(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const fullName = (formData.get("full_name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const phone = (formData.get("phone") as string).trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (password !== confirm) return { error: "Şifreler eşleşmiyor.", success: false };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalıdır.", success: false };

  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: translateError(error.message), success: false };
  return { error: null, success: true };
}
