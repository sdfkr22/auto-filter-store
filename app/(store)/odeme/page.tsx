import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart/actions";
import CheckoutFlow from "./CheckoutFlow";

export const metadata: Metadata = { title: "Ödeme" };

export default async function OdemePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris?next=/odeme");

  const [cart, addressesRes, shippingRes, profileRes] = await Promise.all([
    getCart(),
    sb.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
    sb.from("shipping_methods").select("*").eq("active", true).order("price"),
    sb.from("profiles").select("full_name, phone").eq("id", user.id).single(),
  ]);

  if (cart.length === 0) redirect("/sepet");

  const addresses = addressesRes.data ?? [];
  const shippingMethods = shippingRes.data ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Ödeme</h1>
        <CheckoutFlow
          cart={cart}
          addresses={addresses}
          shippingMethods={shippingMethods}
          defaultFullName={profileRes.data?.full_name ?? ""}
          defaultPhone={profileRes.data?.phone ?? ""}
        />
      </main>
    </div>
  );
}
