"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (msg.includes("Email not confirmed")) return "E-posta adresinizi doğrulamanız gerekiyor.";
  if (msg.includes("too many requests")) return "Çok fazla deneme. Lütfen bekleyin.";
  return "Giriş yapılamadı. Lütfen tekrar deneyin.";
}

export async function signIn(
  _: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateError(error.message) };

  const next = (formData.get("next") as string) || "/hesabim";
  redirect(next);
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? headersList.get("origin");
  const next = (formData.get("next") as string) || "/hesabim";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(`/giris?error=oauth_error`);
  if (data.url) redirect(data.url);
}
