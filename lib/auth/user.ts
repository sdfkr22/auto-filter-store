import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

// React.cache: aynı request boyunca tek kez çalışır → bir sayfa hem layout hem
// içeride kullanırken Supabase'e iki kez gitmez.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    null;

  return { id: user.id, email: user.email ?? null, displayName };
});
