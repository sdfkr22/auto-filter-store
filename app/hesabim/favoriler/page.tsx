import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import { getWishlist } from "@/lib/wishlist/actions";
import AddToCartButton from "@/app/(store)/urunler/AddToCartButton";
import WishlistButton from "@/components/wishlist/WishlistButton";

export const metadata: Metadata = { title: "Favorilerim" };

const fmt = (n: number) => `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MANN_BADGE_BG = "#0e1e30";
const MANN_COLOR = "#8fa4c0";

const s = {
  wrap: { minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" } as const,
  main: { maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" } as const,
  header: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" as const } as const,
  title: { fontSize: 22, fontWeight: 700 } as const,
  back: { fontSize: 12, color: "#888", textDecoration: "none" } as const,
  empty: {
    textAlign: "center" as const, padding: "80px 0", color: "#666", fontSize: 14,
  } as const,
  emptyCta: { display: "inline-block", marginTop: 16, color: "#FFED00", fontSize: 13, textDecoration: "none" } as const,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 } as const,
  card: {
    background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12,
    display: "flex", flexDirection: "column" as const, overflow: "hidden", position: "relative" as const,
  } as const,
  cardLink: { display: "flex", flexDirection: "column" as const, color: "inherit", textDecoration: "none", flex: 1 } as const,
  imageBox: {
    aspectRatio: "4/3", background: "linear-gradient(145deg, #101010 0%, #181818 100%)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    margin: "10px 10px 0", borderRadius: 8, overflow: "hidden" as const, position: "relative" as const,
  } as const,
  imagePlaceholder: {
    width: 48, height: 48, borderRadius: 8, background: "#1c1c1c",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#333",
  } as const,
  body: { padding: "14px 16px 8px", display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 } as const,
  badge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
    fontFamily: "monospace",
    background: MANN_BADGE_BG, color: MANN_COLOR,
    border: "1px solid #1e3050",
    alignSelf: "flex-start" as const,
  } as const,
  name: { fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" as const } as const,
  fancy: { fontSize: 12, color: "#666", lineHeight: 1.4 } as const,
  spacer: { flex: 1 } as const,
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 } as const,
  price: { fontSize: 15, fontWeight: 700, color: "#e5e5e5" } as const,
  comparePrice: { fontSize: 11, color: "#666", textDecoration: "line-through" } as const,
  stock: (ok: boolean) => ({
    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
    background: ok ? "#0a2010" : "#1e1010", color: ok ? "#52c07a" : "#905050",
  }),
  footer: { padding: "0 14px 14px" } as const,
};

export default async function FavorilerPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/giris?next=/hesabim/favoriler");

  const items = await getWishlist();

  return (
    <div style={s.wrap}>
      <StoreHeaderShell />

      <main style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Favorilerim</h1>
          <Link href="/hesabim" style={s.back}>← Hesabım</Link>
        </div>

        {items.length === 0 ? (
          <div style={s.empty}>
            Henüz favori ürününüz yok.
            <div>
              <Link href="/urunler" style={s.emptyCta}>Ürünlere göz at →</Link>
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {items.map((p) => {
              const isMann = (p.productType ?? "mann") !== "filtron";
              const enabled = p.stock > 0 && p.price > 0;
              const outLabel = p.stock <= 0 ? "Tükendi" : "Fiyat sorunuz";
              return (
                <div key={p.productId} style={s.card}>
                  <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                    <WishlistButton productId={p.productId} variant="icon-floating" />
                  </div>
                  <Link href={`/urun/${encodeURIComponent(p.productName)}`} style={s.cardLink}>
                    <div style={s.imageBox}>
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.productName} fill sizes="200px" style={{ objectFit: "contain" }} />
                      ) : (
                        <div style={s.imagePlaceholder}>⬡</div>
                      )}
                    </div>
                    <div style={s.body}>
                      <span style={s.badge}>{isMann ? "MANN" : "FILTRON"}</span>
                      <div style={s.name}>{p.productName}</div>
                      {p.productFancyName && p.productFancyName !== p.productName && (
                        <div style={s.fancy}>{p.productFancyName}</div>
                      )}
                      <div style={s.spacer} />
                      <div style={s.priceRow}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {p.comparePrice && p.comparePrice > p.price && p.price > 0 && (
                            <span style={s.comparePrice}>{fmt(p.comparePrice)}</span>
                          )}
                          <span style={s.price}>{p.price > 0 ? fmt(p.price) : "Fiyat sorunuz"}</span>
                        </div>
                        <span style={s.stock(p.stock > 0)}>{p.stock > 0 ? "Stokta" : "Tükendi"}</span>
                      </div>
                    </div>
                  </Link>
                  <div style={s.footer}>
                    <AddToCartButton productId={p.productId} enabled={enabled} outOfStockLabel={outLabel} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
