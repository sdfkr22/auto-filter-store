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

const MANN_ACCENT   = "#4a8a5a";
const FILTRON_ACCENT = "#4a7aaa";

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

  const isMann = product.product_type === "mann";
  const mannProduct = isMann ? product : equivalent;

  const mannCode = mannProduct?.product_name ?? "";
  const vehicles = mannCode ? getCompatibleVehicles(mannCode) : [];

  const ACCENT = isMann ? MANN_ACCENT : FILTRON_ACCENT;
  const BRAND  = isMann ? "MANN-FILTER" : "FİLTRON";

  const inStock  = product.stock > 0;
  const hasPrice = product.price > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #141414", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" }}>
          auto<span style={{ color: "#8fa4c0" }}>-filter</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/urunler" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>← Ürünler</Link>
          <span style={{ color: "#333", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "monospace" }}>{product.product_name}</span>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderLeft: `3px solid ${ACCENT}`, borderRadius: 14, overflow: "hidden" }}>

            {/* Üst: resim + bilgi yan yana */}
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>

              {product.image_url && (
                <div style={{ width: 240, flexShrink: 0, background: "#111", borderRight: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", borderRadius: "14px 0 0 14px" }}>
                  <ProductImage
                    src={product.image_url}
                    alt={product.product_name}
                    style={{ maxWidth: 192, maxHeight: 220, objectFit: "contain", position: "relative", zIndex: 1 }}
                  />
                </div>
              )}

              <div style={{ flex: 1, padding: "22px 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Marka + kod */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#333", flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.12em" }}>{BRAND}</span>
                </div>

                {/* Ürün adı */}
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e5e5", lineHeight: 1.4 }}>
                  {product.product_fancy_name ?? product.product_name}
                </div>

                {/* Fiyat */}
                <div style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", marginTop: 2 }}>
                  {hasPrice
                    ? `₺${product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                    : <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}>Fiyat sorunuz</span>}
                </div>

                {/* Stok */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: inStock ? "#52c07a" : "#905050", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: inStock ? "#52c07a" : "#905050" }}>
                    {inStock ? `Stokta var — ${product.stock} adet` : "Stokta yok"}
                  </span>
                </div>
              </div>
            </div>

            {/* Alt: sepet butonu */}
            <div style={{ padding: "0 16px 16px" }}>
              <button
                style={{ display: "block", width: "100%", background: inStock && hasPrice ? "#8fa4c0" : "#161616", color: inStock && hasPrice ? "#090909" : "#444", border: inStock && hasPrice ? "none" : "1px solid #222", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: inStock && hasPrice ? "pointer" : "not-allowed" }}
                disabled={!inStock || !hasPrice}>
                {inStock && hasPrice ? "Sepete Ekle" : "Şu an satışta değil"}
              </button>
            </div>

          </div>
        </div>

        {/* Uyumlu araçlar */}
        {(() => {
          const T = isMann
            ? { head: "#0d1a10", headBorder: "#1a3020", headText: "#4a9a5a", makesBg: "#0a1510", makesBorder: "#162a1a", makesText: "#3a7a4a", kwColor: "#4a8a55", zebraOdd: "#0d100e" }
            : { head: "#0d1520", headBorder: "#1a2a40", headText: "#4a7aaa", makesBg: "#0a1220", makesBorder: "#162030", makesText: "#3a6a9a", kwColor: "#4a7aaa", zebraOdd: "#0d1018" };
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1e1e1e" }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Uyumlu Araçlar</span>
                <span style={{ fontSize: 12, fontWeight: 600, background: T.makesBg, color: T.headText, padding: "2px 10px", borderRadius: 20 }}>{vehicles.length}</span>
              </div>
              {vehicles.length === 0 ? (
                <div style={{ color: "#555", fontSize: 13 }}>Uyumlu araç verisi bulunamadı.</div>
              ) : (() => {
                const grouped: Record<string, typeof vehicles> = {};
                for (const v of vehicles) {
                  if (!grouped[v.make]) grouped[v.make] = [];
                  grouped[v.make].push(v);
                }
                const makes = Object.keys(grouped).sort();
                return (
                  <div style={{ overflowY: "auto", maxHeight: 460, borderRadius: 10, border: `1px solid ${T.headBorder}` }}>
                    {/* Sütun başlığı */}
                    <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.head, borderBottom: `1px solid ${T.headBorder}`, padding: "0 14px", height: 38 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.headText, textTransform: "uppercase", letterSpacing: "0.06em" }}>Model / Motor</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.headText, textTransform: "uppercase", letterSpacing: "0.06em" }}>kW / PS</span>
                    </div>
                    {makes.map((make) => (
                      <div key={make}>
                        {/* Marka sticky başlığı */}
                        <div style={{ position: "sticky", top: 38, zIndex: 1, background: T.makesBg, borderTop: `1px solid ${T.makesBorder}`, borderBottom: `1px solid ${T.makesBorder}`, padding: "5px 14px", fontSize: 10, fontWeight: 700, color: T.makesText, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {make}
                        </div>
                        {grouped[make].map((v, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: i % 2 === 0 ? "#0c0c0c" : T.zebraOdd, padding: "8px 14px", borderBottom: "1px solid #131313" }}>
                            <div>
                              <div style={{ fontSize: 13, color: "#ccd4dc", fontWeight: 500 }}>{v.model}</div>
                              {v.engine && <div style={{ fontSize: 11, color: "#5a6a7a", marginTop: 2 }}>{v.engine}</div>}
                            </div>
                            <div style={{ fontSize: 12, fontFamily: "monospace", color: T.kwColor, textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                              {v.kw ? `${v.kw} / ${v.ps}` : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
