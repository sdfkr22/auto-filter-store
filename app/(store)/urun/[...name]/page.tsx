import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompatibleVehicles } from "@/lib/mann-data";
import { supabaseAnon } from "@/lib/supabase/anon";
import ProductImage from "./ProductImage";
import AddToCart from "./AddToCart";
import BackButton from "./BackButton";
import StoreHeaderShell from "@/components/StoreHeaderShell";

const MANN_ACCENT   = "#4a8a5a";
const FILTRON_ACCENT = "#4a7aaa";

type ProductRow = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  product_type: string;
  label: string | null;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  active: boolean;
  equivalent_id: string | null;
};

// products.label → /urunler?kategori=... slug + görünür isim
const LABEL_TO_CATEGORY: Record<string, { slug: string; name: string }> = {
  "Hava filtresi":        { slug: "hava-filtresi",  name: "Hava Filtresi"  },
  "Yag filtresi":         { slug: "yag-filtresi",   name: "Yağ Filtresi"   },
  "Yakit filtresi":       { slug: "yakit-filtresi", name: "Yakıt Filtresi" },
  "Kabin hava filtresi":  { slug: "polen-filtresi", name: "Polen Filtresi" },
};

type ProductWithEquivalent = ProductRow & { equivalent: ProductRow | null };

const PRODUCT_FIELDS = "id, product_name, product_fancy_name, product_type, label, image_url, price, compare_price, stock, active, equivalent_id";

// Tek query'de ürün + eşdeğeri (FK üzerinden embedded join). 1 saatlik cache —
// hem generateMetadata hem render aynı cache key'i paylaşır, dedupe edilir.
const getProduct = unstable_cache(
  async (productName: string): Promise<ProductWithEquivalent | null> => {
    const { data } = await supabaseAnon
      .from("products")
      .select(`${PRODUCT_FIELDS}, equivalent:equivalent_id (${PRODUCT_FIELDS})`)
      .eq("product_name", productName)
      .single();
    return data as ProductWithEquivalent | null;
  },
  ["urun:product"],
  { revalidate: 3600, tags: ["products"] }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string[] }>;
}): Promise<Metadata> {
  const { name } = await params;
  const productName = name.map(decodeURIComponent).join("/");
  const data = await getProduct(productName);
  return { title: data ? `${data.product_name} — ${data.product_fancy_name ?? ""}` : "Ürün Detayı" };
}

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ name: string[] }>;
}) {
  const { name } = await params;
  const productName = name.map(decodeURIComponent).join("/");

  const full = await getProduct(productName);
  if (!full) notFound();

  const { equivalent, ...product } = full;

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
      <StoreHeaderShell />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* Breadcrumb */}
        {(() => {
          const cat = product.label ? LABEL_TO_CATEGORY[product.label] : null;
          const crumbLink: React.CSSProperties = { color: "#666", textDecoration: "none" };
          const crumbSep:  React.CSSProperties = { color: "#333", margin: "0 6px" };
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <nav aria-label="Breadcrumb" style={{ fontSize: 12, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                <Link href="/" style={crumbLink}>Ana Sayfa</Link>
                <span style={crumbSep}>›</span>
                <Link href="/urunler" style={crumbLink}>Ürünler</Link>
                {cat && (
                  <>
                    <span style={crumbSep}>›</span>
                    <Link href={`/urunler?kategori=${cat.slug}`} style={crumbLink}>{cat.name}</Link>
                  </>
                )}
                <span style={crumbSep}>›</span>
                <span style={{ color: "#aaa", fontFamily: "monospace" }}>{product.product_name}</span>
              </nav>
              <BackButton />
            </div>
          );
        })()}

        <div style={{ marginBottom: 40 }}>
          <div style={{ background: "#0f0f0f", border: "1px solid #1c1c1c", borderLeft: `3px solid ${ACCENT}`, borderRadius: 14, overflow: "hidden" }}>

            {/* Üst: resim + bilgi yan yana */}
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>

              {product.image_url && (
                <div style={{ width: 240, flexShrink: 0, background: "#111", borderRight: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", borderRadius: "14px 0 0 14px" }}>
                  <ProductImage
                    src={product.image_url}
                    alt={product.product_name}
                    width={192}
                    height={220}
                    style={{ width: "auto", height: "auto", maxWidth: 192, maxHeight: 220, objectFit: "contain", position: "relative", zIndex: 1 }}
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
                <div style={{ marginTop: 2 }}>
                  {hasPrice && product.compare_price && product.compare_price > product.price && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#666", textDecoration: "line-through" }}>
                        ₺{product.compare_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#e05252", background: "#2a0e0e", border: "1px solid #4a1818", padding: "2px 7px", borderRadius: 4 }}>
                        %{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)} indirim
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0" }}>
                    {hasPrice
                      ? `₺${product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                      : <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}>Fiyat sorunuz</span>}
                  </div>
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

            {/* Alt: adet + sepet butonu */}
            <div style={{ padding: "0 16px 16px" }}>
              <AddToCart productId={product.id} stock={product.stock} hasPrice={hasPrice} />
            </div>

          </div>
        </div>

        {/* Muadil ürün */}
        {equivalent && (() => {
          const eqIsMann = equivalent.product_type === "mann";
          const EQ_ACCENT = eqIsMann ? MANN_ACCENT : FILTRON_ACCENT;
          const EQ_BRAND  = eqIsMann ? "MANN-FILTER" : "FİLTRON";
          const eqInStock = equivalent.stock > 0;
          const eqHasPrice = equivalent.price > 0;
          return (
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Muadil Ürün
              </div>
              <Link href={`/urun/${equivalent.product_name}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div style={{ background: "#0c0c0c", border: "1px solid #1c1c1c", borderLeft: `3px solid ${EQ_ACCENT}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: EQ_ACCENT, textTransform: "uppercase", letterSpacing: "0.12em" }}>{EQ_BRAND}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#e5e5e5", fontFamily: "monospace" }}>{equivalent.product_name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: eqInStock ? "#52c07a" : "#905050", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: eqInStock ? "#52c07a" : "#905050" }}>
                        {eqInStock ? "Stokta var" : "Stokta yok"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {eqHasPrice && equivalent.compare_price && equivalent.compare_price > equivalent.price && (
                      <div style={{ fontSize: 11, color: "#666", textDecoration: "line-through" }}>
                        ₺{equivalent.compare_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
                      {eqHasPrice
                        ? `₺${equivalent.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                        : <span style={{ fontSize: 12, color: "#555", fontWeight: 400 }}>Fiyat sorunuz</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>İncele →</div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })()}

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
