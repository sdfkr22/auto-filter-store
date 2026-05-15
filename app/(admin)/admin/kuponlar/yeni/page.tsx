import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import CouponForm from "../CouponForm";

export const metadata = { title: "Yeni Kupon" };

export default async function NewCouponPage() {
  await requireAdmin();
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <Link href="/admin/kuponlar" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
          ← Kuponlar
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Yeni Kupon</h1>
      </div>
      <CouponForm />
    </div>
  );
}
