"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function resetPassword(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const email = (formData.get("email") as string).trim();
  const headersList = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? headersList.get("origin");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });

  // Güvenlik: hata olsa da başarı mesajı döndür
  if (error) console.error("resetPassword:", error.message);
  return { error: null, success: true };
}
