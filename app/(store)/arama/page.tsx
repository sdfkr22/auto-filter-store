import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabaseAnon } from "@/lib/supabase/anon";
import StoreHeaderShell from "@/components/StoreHeaderShell";

export const metadata: Metadata = { title: "Arama" };

const fmt = (n: number) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAGE_SIZE = 48;

type SearchParams = Promise<{ q?: string; sayfa?: string }>;

async function searchProducts(term: string, page: number) {
  const safe = term.replace(/[%_,()*]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) return { products: [], total: 0 };

  const pattern = `%${safe}%`;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const { data, count } = await supabaseAnon
    .from("products")
    .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock", { count: "exact" })
    .eq("active", true)
    .or(`product_name.ilike.${pattern},product_fancy_name.ilike.${pattern}`)
    .order("stock", { ascending: false })
    .range(start, end);

  return { products: data ?? [], total: count ?? 0 };
}

export default async function AramaPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", sayfa } = await searchParams;
  const term = q.trim();
  const page = Math.max(1, parseInt(sayfa ?? "1", 10) || 1);

  const { products, total } = term.length >= 2
    ? await searchProducts(term, page)
    : { products: [], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ q: term });
    if (p > 1) params.set("sayfa", String(p));
    return `/arama?${params.toString()}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Arama Sonuçları
        </h1>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 28 }}>
          {term.length < 2
            ? "En az 2 karakter girin."
            : <><strong style={{ color: "#FFED00" }}>{term}</strong> için {total.toLocaleString("tr-TR")} sonuç bulundu.</>
          }
        </p>

        {term.length >= 2 && products.length === 0 ? (
          <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, color: "#aaa", marginBottom: 8 }}>Sonuç bulunamadı</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
              MANN veya Filtron koduyla aramayı deneyin (örn. <code style={{ color: "#888" }}>W712/52</code>).
              Aracınıza uygun filtre arıyorsanız ana sayfadaki araç seçiciyi kullanın.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" style={btn}>Araç Seçici</Link>
              <Link href="/urunler" style={btnGhost}>Tüm Ürünler</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {products.map((p) => {
                const isMann = (p.product_type ?? "mann") !== "filtron";
                const discount = p.compare_price && p.compare_price > p.price
                  ? Math.round((1 - p.price / p.compare_price) * 100)
                  : null;
                return (
                  <Link
                    key={p.id}
                    href={`/urun/${encodeURIComponent(p.product_name)}`}
                    style={{
                      background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12,
                      color: "#e5e5e5", textDecoration: "none", display: "flex", flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ aspectRatio: "4/3", background: "linear-gradient(145deg, #101010, #181818)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, borderBottom: "1px solid #1a1a1a" }}>
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.product_name} width={140} height={140} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ fontSize: 20, color: "#333" }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", background: "#0e1e30", color: isMann ? "#8fa4c0" : "#8fa4c0", border: "1px solid #1e3050", textTransform: "uppercase" }}>
                        {isMann ? "MANN" : "Filtron"}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "#fff" }}>{p.product_name}</div>
                      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{p.product_fancy_name ?? ""}</div>
                      <div style={{ flex: 1 }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
                        <div>
                          {p.compare_price && discount != null && (
                            <div style={{ fontSize: 11, color: "#666", textDecoration: "line-through" }}>{fmt(p.compare_price)}</div>
                          )}
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{p.price > 0 ? fmt(p.price) : <span style={{ color: "#555" }}>—</span>}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: p.stock > 0 ? "#0a2010" : "#1e1010", color: p.stock > 0 ? "#52c07a" : "#905050" }}>
                          {p.stock > 0 ? "Stokta" : "Tükendi"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40 }}>
                <Link href={page > 1 ? buildUrl(page - 1) : "#"} style={pageBtn(page <= 1)}>← Önceki</Link>
                <span style={{ fontSize: 12, color: "#555", padding: "0 8px" }}>Sayfa {page} / {totalPages}</span>
                <Link href={page < totalPages ? buildUrl(page + 1) : "#"} style={pageBtn(page >= totalPages)}>Sonraki →</Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#FFED00", color: "#0a0a0a", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none",
};
const btnGhost: React.CSSProperties = {
  background: "transparent", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 8, padding: "10px 20px", fontSize: 13, textDecoration: "none",
};
const pageBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 6, fontSize: 13, border: "1px solid #222",
  background: disabled ? "transparent" : "#131313",
  color: disabled ? "#333" : "#aaa",
  textDecoration: "none",
  pointerEvents: disabled ? "none" : "auto",
});
