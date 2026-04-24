import { createClient } from "@supabase/supabase-js";

// Sadece server-side API routes'larda kullan — service role key taşır
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
