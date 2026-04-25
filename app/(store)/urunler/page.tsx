import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ürünler" };

const MANN_BADGE_BG   = "#0e2018";
const MANN_COLOR      = "#6abf7b";
const FILTRON_BADGE_BG = "#0e1e30";
const FILTRON_COLOR   = "#8fa4c0";

const s = {
  wrap:  { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  header: { borderBottom: "1px solid #141414", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" } as const,
  logo:  { fontSize: 20, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#6abf7b" } as const,
  nav:   { display: "flex", gap: 8 } as const,
  navLink: { fontSize: 13, color: "#888", textDecoration: "none", padding: "6px 14px", borderRadius: 6 } as const,
  main:  { maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" } as const,
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 } as const,
  pageTitle: { fontSize: 22, fontWeight: 700 } as const,
  tabs:  { display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 32 },
  tab: (active: boolean) => ({
    padding: "6px 18px", borderRadius: 20, fontSize: 13, cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "#6abf7b" : "#222",
    background:  active ? "#6abf7b18" : "transparent",
    color:       active ? "#6abf7b" : "#555",
    textDecoration: "none",
    transition: "all 0.15s",
  }),
  grid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 } as const,
  card:  {
    background: "#0f0f0f",
    border: "1px solid #1c1c1c",
    borderRadius: 12,
    textDecoration: "none",
    color: "#e5e5e5",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    transition: "border-color 0.15s",
  } as const,
  imageBox: {
    aspectRatio: "4/3",
    background: "linear-gradient(145deg, #101010 0%, #181818 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    borderBottom: "1px solid #1a1a1a",
  } as const,
  imagePlaceholder: {
    width: 48, height: 48,
    borderRadius: 8,
    background: "#1c1c1c",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, color: "#333",
  } as const,
  cardBody: { padding: "14px 16px 16px", display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 } as const,
  badge: (isMann: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
    fontFamily: "monospace",
    background: isMann ? MANN_BADGE_BG : FILTRON_BADGE_BG,
    color:      isMann ? MANN_COLOR    : FILTRON_COLOR,
    border: `1px solid ${isMann ? "#1e4030" : "#1e3050"}`,
    alignSelf: "flex-start" as const,
  }),
  brandDot: (isMann: boolean) => ({
    width: 5, height: 5, borderRadius: "50%",
    background: isMann ? MANN_COLOR : FILTRON_COLOR,
    flexShrink: 0,
  }),
  fancyName: { fontSize: 12, color: "#666", lineHeight: 1.4, marginTop: 2 } as const,
  spacer: { flex: 1 } as const,
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 } as const,
  price:    { fontSize: 15, fontWeight: 700, color: "#e5e5e5" } as const,
  priceMuted: { fontSize: 13, color: "#444" } as const,
  stock: (ok: boolean) => ({
    fontSize: 10, fontWeight: 600,
    padding: "2px 7px", borderRadius: 10,
    background: ok ? "#0a2010" : "#1e1010",
    color: ok ? "#52c07a" : "#905050",
  }),
  empty: { textAlign: "center" as const, padding: "80px 0", color: "#444", fontSize: 14 },
};

// products.json label → kategori slug eşleşmesi
const SLUG_TO_LABEL: Record<string, string> = {
  "hava-filtresi":  "Hava filtresi",
  "yag-filtresi":   "Yag filtresi",
  "yakit-filtresi": "Yakit filtresi",
  "polen-filtresi": "Kabin hava filtresi",
};

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const supabase = await createClient();

  const label = kategori ? SLUG_TO_LABEL[kategori] : undefined;

  const [{ data: categories }, { data: rawProducts }] = await Promise.all([
    supabase.from("categories").select("id, slug, name_tr, icon").order("sort_order"),
    label
      ? supabase
          .from("products")
          .select("id, product_name, product_fancy_name, product_type, image_url, price, stock")
          .eq("active", true)
          .eq("label", label)
          .order("product_name")
      : supabase
          .from("products")
          .select("id, product_name, product_fancy_name, product_type, image_url, price, stock")
          .eq("active", true)
          .order("product_name"),
  ]);

  const products = rawProducts ?? [];
  const isMann = (type: string | null | undefined) => (type ?? "mann") !== "filtron";

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <Link href="/" style={s.logo}>auto<span style={s.logoDot}>-filter</span></Link>
        <nav style={s.nav}>
          <Link href="/" style={s.navLink}>Ana Sayfa</Link>
          <Link href="/hesabim" style={s.navLink}>Hesabım</Link>
        </nav>
      </header>

      <main style={s.main}>
        <div style={s.topRow}>
          <h1 style={s.pageTitle}>Ürünler</h1>
          <span style={{ fontSize: 13, color: "#444" }}>{products.length} ürün</span>
        </div>

        <div style={s.tabs}>
          <Link href="/urunler" style={s.tab(!kategori)}>Tümü</Link>
          {(categories ?? []).map((c) => (
            <Link key={c.slug} href={`/urunler?kategori=${c.slug}`} style={s.tab(kategori === c.slug)}>
              {c.icon} {c.name_tr}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div style={s.empty}>Bu kategoride ürün bulunamadı.</div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => {
              const mann = isMann(p.product_type);
              return (
                <Link key={p.id} href={`/urun/${p.id}`} style={s.card}>
                  <div style={s.imageBox}>
                    {p.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.image_url}
                        alt={p.product_name}
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <div style={s.imagePlaceholder}>⬡</div>
                    )}
                  </div>

                  <div style={s.cardBody}>
                    <span style={s.badge(mann)}>
                      <span style={s.brandDot(mann)} />
                      {mann ? "MANN" : "FILTRON"} {p.product_name}
                    </span>

                    {p.product_fancy_name && p.product_fancy_name !== p.product_name && (
                      <div style={s.fancyName}>{p.product_fancy_name}</div>
                    )}

                    <div style={s.spacer} />

                    <div style={s.priceRow}>
                      <span style={p.price > 0 ? s.price : s.priceMuted}>
                        {p.price > 0
                          ? `₺${p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                          : "Fiyat sorunuz"}
                      </span>
                      <span style={s.stock(p.stock > 0)}>
                        {p.stock > 0 ? "Stokta" : "Tükendi"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
