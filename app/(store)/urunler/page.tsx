import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { supabaseAnon } from "@/lib/supabase/anon";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import AddToCartButton from "./AddToCartButton";
import FilterSidebar from "./FilterSidebar";
import SortSelectClient from "./SortSelect";

export const metadata: Metadata = { title: "Ürünler" };

const PAGE_SIZE = 48;

type SortKey = "yeni" | "fiyat-artan" | "fiyat-azalan" | "ad";
const VALID_SORTS: SortKey[] = ["yeni", "fiyat-artan", "fiyat-azalan", "ad"];

type Brand = "mann" | "filtron";
const VALID_BRANDS: Brand[] = ["mann", "filtron"];

const getCategories = unstable_cache(
  async () => {
    const { data } = await supabaseAnon
      .from("categories")
      .select("id, slug, name_tr, icon")
      .order("sort_order");
    return data ?? [];
  },
  ["urunler:categories"],
  { revalidate: 3600, tags: ["categories"] }
);

type Filters = {
  label?: string;
  brand?: Brand;
  min?: number;
  max?: number;
  sort: SortKey;
  page: number;
};

async function getProductsPage(f: Filters) {
  const start = (f.page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  let q = supabaseAnon
    .from("products")
    .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock, created_at", { count: "exact" })
    .eq("active", true);

  if (f.label) q = q.eq("label", f.label);
  if (f.brand) q = q.eq("product_type", f.brand);
  if (f.min != null) q = q.gte("price", f.min);
  if (f.max != null) q = q.lte("price", f.max);

  switch (f.sort) {
    case "fiyat-artan":  q = q.order("price", { ascending: true, nullsFirst: false }); break;
    case "fiyat-azalan": q = q.order("price", { ascending: false, nullsFirst: false }); break;
    case "yeni":         q = q.order("created_at", { ascending: false, nullsFirst: false }); break;
    case "ad":           q = q.order("product_name"); break;
  }

  const { data, count } = await q.range(start, end);
  return { products: data ?? [], total: count ?? 0 };
}

const MANN_BADGE_BG = "#0e1e30";
const MANN_COLOR = "#8fa4c0";

const s = {
  wrap:  { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main:  { maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" } as const,
  layout: { display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" } as const,
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" as const } as const,
  pageTitle: { fontSize: 22, fontWeight: 700 } as const,
  resultCount: { fontSize: 13, color: "#666" } as const,
  toolsRow: { display: "flex", alignItems: "center", gap: 10 } as const,
  sortLabel: { fontSize: 12, color: "#666" } as const,
  sortSelect: {
    background: "#0c0c0c",
    border: "1px solid #1f1f1f",
    borderRadius: 6,
    padding: "7px 30px 7px 12px",
    color: "#e5e5e5",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  } as const,
  grid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 } as const,
  card:  {
    background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12,
    color: "#e5e5e5", display: "flex", flexDirection: "column" as const, overflow: "hidden",
    transition: "border-color 0.15s",
  } as const,
  cardLink: { display: "flex", flexDirection: "column" as const, color: "inherit", textDecoration: "none", flex: 1 } as const,
  cardFooter: { padding: "0 14px 14px" } as const,
  imageBox: {
    aspectRatio: "4/3", background: "linear-gradient(145deg, #101010 0%, #181818 100%)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    margin: "10px 10px 0", borderRadius: 8, overflow: "hidden",
  } as const,
  imagePlaceholder: {
    width: 48, height: 48, borderRadius: 8, background: "#1c1c1c",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#333",
  } as const,
  cardBody: { padding: "14px 16px 16px", display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 } as const,
  badge: (isMann: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
    fontFamily: "monospace",
    background: MANN_BADGE_BG, color: MANN_COLOR,
    border: "1px solid #1e3050",
    alignSelf: "flex-start" as const,
  }),
  brandDot: (isMann: boolean) => ({ width: 5, height: 5, borderRadius: "50%", background: MANN_COLOR, flexShrink: 0 }),
  fancyName: { fontSize: 12, color: "#666", lineHeight: 1.4, marginTop: 2 } as const,
  spacer: { flex: 1 } as const,
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 } as const,
  priceCol: { display: "flex", flexDirection: "column" as const, gap: 2 } as const,
  price: { fontSize: 15, fontWeight: 700, color: "#e5e5e5" } as const,
  priceMuted: { fontSize: 13, color: "#444" } as const,
  comparePrice: { fontSize: 11, color: "#666", textDecoration: "line-through" } as const,
  discountBadge: {
    fontSize: 10, fontWeight: 700, color: "#e05252", background: "#2a0e0e",
    border: "1px solid #4a1818", padding: "2px 6px", borderRadius: 4, alignSelf: "flex-start" as const,
  } as const,
  stock: (ok: boolean) => ({
    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
    background: ok ? "#0a2010" : "#1e1010", color: ok ? "#52c07a" : "#905050",
  }),
  empty: { textAlign: "center" as const, padding: "80px 0", color: "#444", fontSize: 14 },
  pager: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40 } as const,
  pageBtn: (disabled: boolean) => ({
    padding: "8px 14px", borderRadius: 6, fontSize: 13, border: "1px solid #222",
    background: disabled ? "transparent" : "#131313",
    color: disabled ? "#333" : "#aaa", textDecoration: "none",
    pointerEvents: disabled ? ("none" as const) : ("auto" as const),
  }),
  pageInfo: { fontSize: 12, color: "#555", padding: "0 8px" } as const,
};

const SLUG_TO_LABEL: Record<string, string> = {
  "hava-filtresi":  "Hava filtresi",
  "yag-filtresi":   "Yag filtresi",
  "yakit-filtresi": "Yakit filtresi",
  "polen-filtresi": "Kabin hava filtresi",
};

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{
    kategori?: string;
    marka?: string;
    min?: string;
    max?: string;
    sirala?: string;
    sayfa?: string;
  }>;
}) {
  const sp = await searchParams;
  const label = sp.kategori ? SLUG_TO_LABEL[sp.kategori] : undefined;
  const brand = sp.marka && (VALID_BRANDS as string[]).includes(sp.marka) ? (sp.marka as Brand) : undefined;
  const min = sp.min ? Math.max(0, Number(sp.min)) : undefined;
  const max = sp.max ? Math.max(0, Number(sp.max)) : undefined;
  const sort: SortKey = sp.sirala && (VALID_SORTS as string[]).includes(sp.sirala) ? (sp.sirala as SortKey) : "ad";
  const page = Math.max(1, parseInt(sp.sayfa ?? "1", 10) || 1);

  const [categories, { products, total }] = await Promise.all([
    getCategories(),
    getProductsPage({ label, brand, min, max, sort, page }),
  ]);

  const isMann = (type: string | null | undefined) => (type ?? "mann") !== "filtron";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildUrl = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      kategori: sp.kategori,
      marka: brand,
      min: min != null ? String(min) : undefined,
      max: max != null ? String(max) : undefined,
      sirala: sort !== "ad" ? sort : undefined,
      sayfa: page > 1 ? String(page) : undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/urunler?${qs}` : "/urunler";
  };

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />

      <main style={s.main}>
        <div style={s.topRow}>
          <h1 style={s.pageTitle}>Ürünler</h1>
          <div style={s.toolsRow}>
            <span style={s.resultCount}>{total.toLocaleString("tr-TR")} ürün</span>
            <span style={{ color: "#222" }}>•</span>
            <span style={s.sortLabel}>Sırala:</span>
            <SortSelectClient
              currentSort={sort}
              options={[
                { value: "ad", label: "Alfabetik", url: buildUrl({ sirala: undefined, sayfa: undefined }) },
                { value: "yeni", label: "En Yeni", url: buildUrl({ sirala: "yeni", sayfa: undefined }) },
                { value: "fiyat-artan", label: "Fiyat: Artan", url: buildUrl({ sirala: "fiyat-artan", sayfa: undefined }) },
                { value: "fiyat-azalan", label: "Fiyat: Azalan", url: buildUrl({ sirala: "fiyat-azalan", sayfa: undefined }) },
              ]}
            />
          </div>
        </div>

        <div style={s.layout}>
          <FilterSidebar
            categories={categories ?? []}
            currentCategory={sp.kategori}
            currentBrand={brand}
            currentMin={min}
            currentMax={max}
          />

          <div>
            {products.length === 0 ? (
              <div style={s.empty}>
                Filtrelere uyan ürün bulunamadı.
                <div style={{ marginTop: 14 }}>
                  <Link href="/urunler" style={{ color: "#FFED00", fontSize: 13, textDecoration: "none" }}>Filtreleri temizle →</Link>
                </div>
              </div>
            ) : (
              <div style={s.grid}>
                {products.map((p) => {
                  const mann = isMann(p.product_type);
                  const enabled = p.stock > 0 && p.price > 0;
                  return (
                    <div key={p.id} className="product-card" style={s.card}>
                      <Link href={`/urun/${p.product_name}`} style={s.cardLink}>
                        <div style={{ ...s.imageBox, position: "relative" }}>
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.product_name}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 200px"
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <div style={s.imagePlaceholder}>⬡</div>
                          )}
                        </div>
                        <div style={s.cardBody}>
                          <span style={s.badge(mann)}>
                            <span style={s.brandDot(mann)} />
                            {mann ? "MANN" : "FILTRON"}
                          </span>
                          {p.product_fancy_name && p.product_fancy_name !== p.product_name && (
                            <div style={s.fancyName}>{p.product_fancy_name}</div>
                          )}
                          <div style={s.spacer} />
                          {p.compare_price && p.compare_price > p.price && p.price > 0 && (
                            <span style={s.discountBadge}>
                              %{Math.round(((p.compare_price - p.price) / p.compare_price) * 100)} indirim
                            </span>
                          )}
                          <div style={s.priceRow}>
                            <div style={s.priceCol}>
                              {p.compare_price && p.compare_price > p.price && p.price > 0 && (
                                <span style={s.comparePrice}>
                                  ₺{p.compare_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              <span style={p.price > 0 ? s.price : s.priceMuted}>
                                {p.price > 0
                                  ? `₺${p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                                  : "Fiyat sorunuz"}
                              </span>
                            </div>
                            <span style={s.stock(p.stock > 0)}>
                              {p.stock > 0 ? "Stokta" : "Tükendi"}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div style={s.cardFooter}>
                        <AddToCartButton
                          productId={p.id}
                          enabled={enabled}
                          outOfStockLabel={p.stock <= 0 ? "Tükendi" : "Fiyat sorunuz"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <nav style={s.pager} aria-label="Sayfalama">
                <Link href={buildUrl({ sayfa: page > 1 ? page - 1 : undefined })} style={s.pageBtn(page <= 1)} aria-disabled={page <= 1}>← Önceki</Link>
                <span style={s.pageInfo}>Sayfa {page} / {totalPages}</span>
                <Link href={buildUrl({ sayfa: page < totalPages ? page + 1 : undefined })} style={s.pageBtn(page >= totalPages)} aria-disabled={page >= totalPages}>Sonraki →</Link>
              </nav>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

