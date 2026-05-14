"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Category = { id: string; slug: string; name_tr: string; icon: string | null };
type Brand = "mann" | "filtron";

const s = {
  wrap: { display: "flex", flexDirection: "column" as const, gap: 18, position: "sticky" as const, top: 80 } as const,
  group: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 16 } as const,
  groupTitle: { fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 } as const,
  listItem: (active: boolean) => ({
    display: "flex" as const, alignItems: "center", gap: 8,
    padding: "8px 10px", borderRadius: 6,
    fontSize: 13,
    color: active ? "#FFED00" : "#aaa",
    background: active ? "#FFED0010" : "transparent",
    textDecoration: "none",
    transition: "background 0.15s",
  }),
  radioRow: (active: boolean) => ({
    display: "flex" as const, alignItems: "center", gap: 8,
    padding: "8px 10px", borderRadius: 6,
    fontSize: 13,
    color: active ? "#fff" : "#aaa",
    background: active ? "#161616" : "transparent",
    textDecoration: "none",
    cursor: "pointer",
    border: "none",
    width: "100%",
    fontFamily: "inherit",
    textAlign: "left" as const,
  }),
  radioDot: (active: boolean): React.CSSProperties => ({
    width: 12, height: 12, borderRadius: "50%",
    border: `2px solid ${active ? "#FFED00" : "#3a3a3a"}`,
    background: active ? "#FFED00" : "transparent",
    flexShrink: 0,
    boxShadow: active ? "inset 0 0 0 2px #0c0c0c" : "none",
  }),
  priceRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 } as const,
  input: {
    width: "100%",
    background: "#111", border: "1px solid #1e1e1e", borderRadius: 6,
    padding: "8px 10px", color: "#e5e5e5", fontSize: 13, outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit",
  } as const,
  applyBtn: {
    width: "100%", marginTop: 10,
    background: "#FFED00", color: "#0a0a0a", border: "none", borderRadius: 6,
    padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit",
  } as const,
  clearBtn: {
    fontSize: 11, color: "#666", textDecoration: "underline",
    background: "transparent", border: "none", padding: 0,
    cursor: "pointer", fontFamily: "inherit",
  } as const,
};

export default function FilterSidebar({
  categories,
  currentCategory,
  currentBrand,
  currentMin,
  currentMax,
}: {
  categories: Category[];
  currentCategory?: string;
  currentBrand?: Brand;
  currentMin?: number;
  currentMax?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [minStr, setMinStr] = useState(currentMin != null ? String(currentMin) : "");
  const [maxStr, setMaxStr] = useState(currentMax != null ? String(currentMax) : "");

  function urlWith(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    params.delete("sayfa");
    const qs = params.toString();
    return qs ? `/urunler?${qs}` : "/urunler";
  }

  function applyPrice() {
    const min = minStr.trim() ? String(Math.max(0, Number(minStr) || 0)) : undefined;
    const max = maxStr.trim() ? String(Math.max(0, Number(maxStr) || 0)) : undefined;
    router.push(urlWith({ min, max }));
  }

  const hasFilters = !!(currentCategory || currentBrand || currentMin != null || currentMax != null);

  return (
    <aside style={s.wrap}>
      {/* Kategori */}
      <div style={s.group}>
        <div style={s.groupTitle}>Kategori</div>
        <Link href={urlWith({ kategori: undefined })} style={s.listItem(!currentCategory)}>
          <span style={{ width: 16 }}>•</span> Tümü
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={urlWith({ kategori: c.slug })} style={s.listItem(currentCategory === c.slug)}>
            <span style={{ width: 16 }}>{c.icon}</span> {c.name_tr}
          </Link>
        ))}
      </div>

      {/* Marka */}
      <div style={s.group}>
        <div style={s.groupTitle}>Marka</div>
        <Link href={urlWith({ marka: undefined })} style={s.radioRow(!currentBrand)}>
          <span style={s.radioDot(!currentBrand)} /> Tümü
        </Link>
        <Link href={urlWith({ marka: "mann" })} style={s.radioRow(currentBrand === "mann")}>
          <span style={s.radioDot(currentBrand === "mann")} /> MANN
        </Link>
        <Link href={urlWith({ marka: "filtron" })} style={s.radioRow(currentBrand === "filtron")}>
          <span style={s.radioDot(currentBrand === "filtron")} /> Filtron
        </Link>
      </div>

      {/* Fiyat aralığı */}
      <div style={s.group}>
        <div style={s.groupTitle}>Fiyat Aralığı (₺)</div>
        <div style={s.priceRow}>
          <input
            type="number"
            min={0}
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            placeholder="En az"
            style={s.input}
            onKeyDown={(e) => { if (e.key === "Enter") applyPrice(); }}
          />
          <input
            type="number"
            min={0}
            value={maxStr}
            onChange={(e) => setMaxStr(e.target.value)}
            placeholder="En çok"
            style={s.input}
            onKeyDown={(e) => { if (e.key === "Enter") applyPrice(); }}
          />
        </div>
        <button type="button" onClick={applyPrice} style={s.applyBtn}>
          Uygula
        </button>
      </div>

      {hasFilters && (
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => { setMinStr(""); setMaxStr(""); router.push("/urunler"); }}
            style={s.clearBtn}
          >
            Tüm filtreleri temizle
          </button>
        </div>
      )}
    </aside>
  );
}
