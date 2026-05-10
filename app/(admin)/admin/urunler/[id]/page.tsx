import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductEditForm from "./ProductEditForm";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createAdminClient();

  const { data: product } = await sb
    .from("products")
    .select(
      "id, product_name, product_fancy_name, product_type, label, image_url, price, compare_price, stock, reserved_stock, active, featured, description_tr, description_en, meta_title_tr, meta_desc_tr, meta_title_en, meta_desc_en"
    )
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/urunler" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>
          ← Ürünlere dön
        </Link>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 4, fontFamily: "monospace" }}>{product.product_name}</h1>
      {product.product_fancy_name && (
        <p style={{ color: "#888", marginBottom: 24 }}>{product.product_fancy_name}</p>
      )}

      <ProductEditForm product={product} />
    </div>
  );
}
