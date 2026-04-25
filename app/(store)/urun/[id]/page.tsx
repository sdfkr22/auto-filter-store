import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import fs from "fs";
import { createClient } from "@/lib/supabase/server";
import ProductImage from "./ProductImage";

type Entry = {
  make: string; model: string; engine: string | null;
  kw: number | null; ps: number | null; year_of_prod: string | null;
  air: string | string[] | null; oil: string | string[] | null;
  fuel: string | string[] | null; cabin: string | string[] | null;
};

const norm = (c: string) => c.replace(/\s+/g, "").toUpperCase();

function getCompatibleVehicles(mannCode: string): Entry[] {
  const p = path.join(process.cwd(), "mann-filter-data.json");
  const data: Entry[] = JSON.parse(fs.readFileSync(p, "utf-8"));
  const target = norm(mannCode);
  const toArr = (v: string | string[] | null) => v == null ? [] : Array.isArray(v) ? v : [v];
  return data.filter((e) =>
    [...toArr(e.air), ...toArr(e.oil), ...toArr(e.fuel), ...toArr(e.cabin)]
      .some((c) => norm(c) === target)
  );
}

const MANN_BG = "#0e2018";
const MANN_BORDER = "#1a4030";
const MANN_BADGE_BG = "#1a3828";
const MANN_TEXT = "#6abf7b";
const MANN_CODE_CLR = "#9de0a8";
const FILTRON_BG = "#0e1e30";
const FILTRON_BORDER = "#1e3a5a";
const FILTRON_BADGE_BG = "#1a3050";
const FILTRON_TEXT = "#8fa4c0";
const FILTRON_CODE_CLR = "#c5d8f0";

type ProductRow = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  product_type: string;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  active: boolean;
  equivalent_id: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("product_name, product_fancy_name")
    .eq("id", id)
    .single();
  return { title: data ? `${data.product_name} — ${data.product_fancy_name ?? ""}` : "Ürün Detayı" };
}

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock, active, equivalent_id")
    .eq("id", id)
    .single() as { data: ProductRow | null };

  if (!product) notFound();

  let equivalent: ProductRow | null = null;
  if (product.equivalent_id) {
    const { data: eq } = await supabase
      .from("products")
      .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock, active, equivalent_id")
      .eq("id", product.equivalent_id)
      .single() as { data: ProductRow | null };
    equivalent = eq;
  }

  const mannProduct   = product.product_type === "mann" ? product : equivalent;
  const filtronProduct = product.product_type === "filtron" ? product : equivalent;

  const mannCode = mannProduct?.product_name ?? "";
  const vehicles = mannCode ? getCompatibleVehicles(mannCode) : [];

  const mannInStock   = (mannProduct?.stock ?? 0) > 0;
  const mannHasPrice  = (mannProduct?.price ?? 0) > 0;
  const filtronInStock  = (filtronProduct?.stock ?? 0) > 0;
  const filtronHasPrice = (filtronProduct?.price ?? 0) > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #141414", padding: "14px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/urunler" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>← Ürünler</Link>
        <span style={{ color: "#333", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "monospace" }}>{product.product_name}</span>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>

          {/* MANN */}
          <div style={{ background: MANN_BG, border: `1px solid ${MANN_BORDER}`, borderRadius: 14, padding: 28 }}>
            {mannProduct?.image_url && (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <ProductImage src={mannProduct.image_url} alt={mannProduct.product_name}
                  style={{ maxHeight: 160, maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            )}
            {mannProduct ? (
              <>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: MANN_BADGE_BG, borderRadius: 6, padding: "5px 12px", marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: MANN_TEXT, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>MANN</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: MANN_CODE_CLR, fontFamily: "monospace" }}>{mannProduct.product_name}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>
                  {mannProduct.product_fancy_name ?? mannProduct.product_name}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                  {mannHasPrice ? `₺${mannProduct.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Fiyat sorunuz"}
                </div>
                <div style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 12, background: mannInStock ? "#0e2a1a" : "#2a1414", color: mannInStock ? "#52c07a" : "#e05252", marginBottom: 20 }}>
                  {mannInStock ? `● Stokta var (${mannProduct.stock} adet)` : "● Stokta yok"}
                </div>
                {mannProduct.id === product.id ? (
                  <button style={{ display: "block", width: "100%", background: mannInStock && mannHasPrice ? MANN_TEXT : "#222", color: mannInStock && mannHasPrice ? "#090909" : "#555", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: mannInStock && mannHasPrice ? "pointer" : "not-allowed" }}
                    disabled={!mannInStock || !mannHasPrice}>
                    {mannInStock && mannHasPrice ? "Sepete Ekle" : "Şu an satışta değil"}
                  </button>
                ) : (
                  <Link href={`/urun/${mannProduct.id}`}
                    style={{ display: "block", width: "100%", background: MANN_TEXT, color: "#090909", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    MANN Ürününe Git →
                  </Link>
                )}
              </>
            ) : (
              <div style={{ color: "#555", fontSize: 13, paddingTop: 8 }}>MANN muadili bulunamadı</div>
            )}
          </div>

          {/* FİLTRON */}
          <div style={{ background: FILTRON_BG, border: `1px solid ${FILTRON_BORDER}`, borderRadius: 14, padding: 28 }}>
            {filtronProduct?.image_url && (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <ProductImage src={filtronProduct.image_url} alt={filtronProduct.product_name}
                  style={{ maxHeight: 160, maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            )}
            {filtronProduct ? (
              <>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: FILTRON_BADGE_BG, borderRadius: 6, padding: "5px 12px", marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: FILTRON_TEXT, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>FİLTRON</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: FILTRON_CODE_CLR, fontFamily: "monospace" }}>{filtronProduct.product_name}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>
                  {filtronProduct.product_fancy_name ?? filtronProduct.product_name}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                  {filtronHasPrice ? `₺${filtronProduct.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Fiyat sorunuz"}
                </div>
                <div style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 12, background: filtronInStock ? "#0e2a1a" : "#2a1414", color: filtronInStock ? "#52c07a" : "#e05252", marginBottom: 20 }}>
                  {filtronInStock ? `● Stokta var (${filtronProduct.stock} adet)` : "● Stokta yok"}
                </div>
                {filtronProduct.id === product.id ? (
                  <button style={{ display: "block", width: "100%", background: filtronInStock && filtronHasPrice ? FILTRON_TEXT : "#222", color: filtronInStock && filtronHasPrice ? "#090909" : "#555", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: filtronInStock && filtronHasPrice ? "pointer" : "not-allowed" }}
                    disabled={!filtronInStock || !filtronHasPrice}>
                    {filtronInStock && filtronHasPrice ? "Sepete Ekle" : "Şu an satışta değil"}
                  </button>
                ) : (
                  <Link href={`/urun/${filtronProduct.id}`}
                    style={{ display: "block", width: "100%", background: FILTRON_TEXT, color: "#090909", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    Filtron Ürününe Git →
                  </Link>
                )}
              </>
            ) : (
              <div style={{ color: "#555", fontSize: 13, paddingTop: 8 }}>Bu ürün için Filtron muadili bulunamadı</div>
            )}
          </div>
        </div>

        {/* Uyumlu araçlar */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1e1e1e" }}>
            Uyumlu Araçlar ({vehicles.length})
          </div>
          {vehicles.length === 0 ? (
            <div style={{ color: "#555", fontSize: 13 }}>Uyumlu araç verisi bulunamadı.</div>
          ) : (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 420, borderRadius: 8, border: "1px solid #1a1a1a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Marka / Model", "Motor", "kW / ps", "Üretim Yılı"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 500, borderBottom: "1px solid #1a1a1a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", color: "#aaa", borderBottom: "1px solid #141414" }}>{v.make} {v.model}</td>
                      <td style={{ padding: "8px 12px", color: "#aaa", borderBottom: "1px solid #141414" }}>{v.engine}</td>
                      <td style={{ padding: "8px 12px", color: "#aaa", borderBottom: "1px solid #141414" }}>{v.kw ? `${v.kw} kW / ${v.ps} ps` : "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#aaa", borderBottom: "1px solid #141414" }}>{v.year_of_prod ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
