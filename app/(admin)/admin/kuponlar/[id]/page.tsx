import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import CouponForm from "../CouponForm";

export const metadata = { title: "Kupon Düzenle" };

type Params = Promise<{ id: string }>;

export default async function EditCouponPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data } = await admin
    .from("coupons")
    .select("id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_until, active")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const coupon = {
    id: data.id,
    code: data.code,
    type: data.type as "percent" | "fixed",
    value: Number(data.value),
    min_order_amount: Number(data.min_order_amount ?? 0),
    max_uses: data.max_uses,
    used_count: data.used_count,
    valid_from: data.valid_from,
    valid_until: data.valid_until,
    active: data.active,
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <Link href="/admin/kuponlar" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
          ← Kuponlar
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6, fontFamily: "monospace" }}>{coupon.code}</h1>
      </div>
      <CouponForm coupon={coupon} />
    </div>
  );
}
