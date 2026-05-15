"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/app/api/search/route";

const fmt = (n: number) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const s = {
  wrap: { position: "relative" as const, flex: 1, maxWidth: 420, minWidth: 220 },
  inputWrap: { position: "relative" as const },
  input: {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid #1f1f1f",
    borderRadius: 8,
    padding: "8px 36px 8px 36px",
    color: "#e5e5e5",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  iconLeft: { position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", pointerEvents: "none" as const },
  iconClear: { position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#666", cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 1, fontFamily: "inherit" },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#0c0c0c",
    border: "1px solid #1f1f1f",
    borderRadius: 8,
    boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
    overflow: "hidden",
    zIndex: 100,
    maxHeight: "70vh",
    overflowY: "auto" as const,
  },
  hit: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid #161616",
    textDecoration: "none",
    color: "inherit",
  },
  hitActive: { background: "#141414" },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    background: "#1a1a1a",
    flexShrink: 0,
    objectFit: "contain" as const,
  },
  hitBody: { flex: 1, minWidth: 0 },
  hitCode: { fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" },
  hitName: { fontSize: 11, color: "#888", overflow: "hidden" as const, textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  hitMeta: { fontSize: 11, color: "#FFED00", fontWeight: 600, marginLeft: 8 },
  hitStockOut: { fontSize: 10, color: "#d17a7a", marginLeft: 8 },
  footer: { padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "center" as const, background: "#0a0a0a" },
  empty: { padding: "16px 12px", fontSize: 12, color: "#666", textAlign: "center" as const },
  loading: { padding: "16px 12px", fontSize: 12, color: "#666", textAlign: "center" as const },
};

function productHref(productName: string) {
  return `/urun/${encodeURIComponent(productName)}`;
}

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce + fetch
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json: { hits: SearchHit[] } = await res.json();
        setHits(json.hits ?? []);
        setActiveIndex(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  // Dış tıklama → kapat
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function goToResults() {
    const term = q.trim();
    if (term.length < 2) return;
    setOpen(false);
    router.push(`/arama?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && hits[activeIndex]) {
        setOpen(false);
        router.push(productHref(hits[activeIndex].product_name));
      } else {
        goToResults();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={wrapRef} className="search-box-wrap" style={s.wrap}>
      <div style={s.inputWrap}>
        <span style={s.iconLeft} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="MANN, Filtron kodu ara…"
          style={s.input}
          aria-label="Ürün ara"
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setHits([]); inputRef.current?.focus(); }} style={s.iconClear} aria-label="Temizle">×</button>
        )}
      </div>

      {showDropdown && (
        <div style={s.dropdown}>
          {loading && hits.length === 0 && <div style={s.loading}>Aranıyor…</div>}
          {!loading && hits.length === 0 && (
            <div style={s.empty}>
              Sonuç bulunamadı.
              <div style={{ marginTop: 8 }}>
                <Link href="/urunler" onClick={() => setOpen(false)} style={{ color: "#FFED00", fontSize: 12, textDecoration: "none" }}>
                  Tüm ürünlere göz at →
                </Link>
              </div>
            </div>
          )}
          {hits.map((h, idx) => (
            <Link
              key={h.id}
              href={productHref(h.product_name)}
              onClick={() => setOpen(false)}
              onMouseEnter={() => setActiveIndex(idx)}
              style={{ ...s.hit, ...(idx === activeIndex ? s.hitActive : {}) }}
            >
              {h.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.image_url} alt="" style={s.thumb} />
              ) : (
                <div style={s.thumb} />
              )}
              <div style={s.hitBody}>
                <div style={s.hitCode}>
                  {h.product_name}
                  <span style={{ marginLeft: 8, fontSize: 10, color: h.product_type === "mann" ? "#4a8a5a" : "#4a7aaa", fontFamily: "system-ui, sans-serif", fontWeight: 600, textTransform: "uppercase" }}>
                    {h.product_type === "mann" ? "MANN" : "Filtron"}
                  </span>
                </div>
                <div style={s.hitName}>{h.product_fancy_name ?? h.label ?? ""}</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                {h.price > 0 && <div style={s.hitMeta}>{fmt(h.price)}</div>}
                {h.stock === 0 && <div style={s.hitStockOut}>Tükendi</div>}
              </div>
            </Link>
          ))}
          {hits.length > 0 && (
            <button type="button" onClick={goToResults} style={{ ...s.footer, border: "none", width: "100%", cursor: "pointer", fontFamily: "inherit" }}>
              Tüm sonuçları gör →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
