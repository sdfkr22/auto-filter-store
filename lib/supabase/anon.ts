import { createClient } from "@supabase/supabase-js";

// Cookies olmadan paylaşılan anon client. Sadece public RLS'li okumalar için
// (kategoriler, aktif ürünler). unstable_cache içinde güvenle kullanılabilir.
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);
