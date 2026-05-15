import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { supabaseAnon } from "@/lib/supabase/anon";
import WishlistButton from "@/components/wishlist/WishlistButton";

const fmt = (n: number) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFeatured = unstable_cache(
  async () => {
    const { data } = await supabaseAnon
      .from("products")
      .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock")
      .eq("active", true)
      .eq("featured", true)
      .gt("price", 0)
      .gt("stock", 0)
      .limit(8);
    return data ?? [];
  },
  ["home:featured-products"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function FeaturedProducts() {
  const products = await getFeatured();
  if (products.length === 0) return null;

  return (
    <section style={{ marginTop: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>Öne Çıkan Ürünler</h2>
        <Link href="/urunler" style={{ fontSize: 12, color: "#FFED00", textDecoration: "none" }}>Tüm ürünler →</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {products.map((p) => {
          const isMann = (p.product_type ?? "mann") !== "filtron";
          const discount = p.compare_price && p.compare_price > p.price
            ? Math.round((1 - p.price / p.compare_price) * 100) : null;
          return (
            <Link
              key={p.id}
              href={`/urun/${encodeURIComponent(p.product_name)}`}
              style={{
                background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 10,
                textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", overflow: "hidden",
                position: "relative",
              }}
            >
              <WishlistButton productId={p.id} variant="icon-floating" />
              <div style={{ aspectRatio: "1/1", position: "relative", background: "linear-gradient(145deg, #101010, #181818)", borderBottom: "1px solid #1a1a1a" }}>
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.product_name} fill sizes="180px" style={{ objectFit: "contain", padding: 14 }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 24 }}>⬡</div>
                )}
                {discount && (
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, color: "#e05252", background: "#2a0e0e", border: "1px solid #4a1818", padding: "2px 6px", borderRadius: 4 }}>
                    %{discount} indirim
                  </span>
                )}
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace", background: "#0e1e30", color: "#8fa4c0", border: "1px solid #1e3050", textTransform: "uppercase" }}>
                  {isMann ? "MANN" : "Filtron"}
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{p.product_name}</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  {p.compare_price && p.compare_price > p.price && (
                    <span style={{ fontSize: 11, color: "#666", textDecoration: "line-through" }}>{fmt(p.compare_price)}</span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginLeft: "auto" }}>{fmt(p.price)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
