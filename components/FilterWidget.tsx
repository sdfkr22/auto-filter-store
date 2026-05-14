"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

const MANN = {
  bg: "linear-gradient(135deg, #08160d, #0a1a10)",
  border: "#16402a",
  borderHover: "#00A758",
  badge: "#00A75818",
  badgeBorder: "#00A75825",
  dot: "#00A758",
  text: "#00A758",
  shadow: "rgba(0,167,88,0.25)",
};
const FILTRON = {
  bg: "linear-gradient(135deg, #0a1520, #0e1a2a)",
  border: "#163050",
  borderHover: "#0082c8",
  badge: "#0082c818",
  badgeBorder: "#0082c825",
  dot: "#0082c8",
  text: "#0082c8",
  shadow: "rgba(0,130,200,0.25)",
};

type FilterItem = {
  mannProductId:    string | null;
  mannCode:         string;
  mannFancyName:    string | null;
  mannImageUrl:     string | null;
  mannPrice:        number;
  mannComparePrice: number | null;
  mannStock:        number;
  mannFound:        boolean;
  filtronProductId:    string | null;
  filtronCode:         string | null;
  filtronImageUrl:     string | null;
  filtronPrice:        number;
  filtronComparePrice: number | null;
  filtronStock:        number;
};

type FilterGroup = {
  type:  string;
  label: string;
  icon:  string;
  items: FilterItem[];
};

type Results = {
  vehicle: {
    make: string; model: string; engine: string | null;
    kw: number | null; ps: number | null; year_of_prod: string | null;
  };
  filterGroups: FilterGroup[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
  return r.json();
}

function MannCard({ item, icon }: { item: FilterItem; icon: string }) {
  const [hovered, setHovered] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const { addItem } = useCart();
  const inStock = item.mannStock > 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.mannProductId || pending) return;
    setPending(true);
    const res = await addItem(item.mannProductId, 1);
    setPending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };

  const card = (
    <div style={{
      background: MANN.bg,
      border: `1px solid ${hovered ? MANN.borderHover : MANN.border}`,
      borderRadius: 8, padding: 14,
      cursor: item.mannProductId ? "pointer" : "default",
      transition: "all .2s",
      transform: hovered ? "translateY(-1px)" : "none",
      boxShadow: hovered ? `0 4px 16px ${MANN.shadow}` : "none",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 6, right: 8, fontSize: 16, lineHeight: 1, color: "#888" }}>{icon}</div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 6, background: MANN.badge, padding: "2px 8px 2px 6px", borderRadius: 4, border: `1px solid ${MANN.badgeBorder}` }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: MANN.dot }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: MANN.text, letterSpacing: 1, textTransform: "uppercase" }}>MANN-FILTER</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: MANN.text, margin: "2px 0", fontFamily: "monospace" }}>
        {item.mannFancyName ?? item.mannCode}
      </div>

      {item.mannFound ? (
        <>
          <div style={{ fontSize: 11, color: inStock ? "#52c07a" : "#e05252", marginTop: 2 }}>
            {inStock ? "● Stokta var" : "● Stokta yok"}
          </div>
          {item.mannComparePrice && item.mannComparePrice > item.mannPrice && item.mannPrice > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#666", textDecoration: "line-through" }}>
                ₺{item.mannComparePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#e05252", background: "#2a0e0e", border: "1px solid #4a1818", padding: "1px 5px", borderRadius: 3 }}>
                %{Math.round(((item.mannComparePrice - item.mannPrice) / item.mannComparePrice) * 100)}
              </span>
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginTop: 4 }}>
            {item.mannPrice > 0
              ? `₺${item.mannPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
              : "Fiyat sorunuz"}
          </div>
          {item.mannProductId && (() => {
            const canBuy = inStock && item.mannPrice > 0;
            const label = canBuy
              ? (done ? "Eklendi ✓" : pending ? "Ekleniyor…" : "Sepete Ekle")
              : (!inStock ? "Tükendi" : "Fiyat sorunuz");
            return (
              <>
                <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Detayları gör →</div>
                <button
                  type="button"
                  onClick={canBuy ? handleAdd : undefined}
                  disabled={!canBuy || pending}
                  style={{
                    marginTop: 6, width: "100%",
                    background: !canBuy ? "#161616" : done ? "#52c07a" : pending ? "#5a6a80" : MANN.dot,
                    color: !canBuy ? "#666" : "#fff",
                    border: !canBuy ? "1px solid #222" : "none",
                    borderRadius: 4,
                    padding: "5px 8px", fontSize: 11, fontWeight: 600,
                    cursor: !canBuy ? "not-allowed" : pending ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              </>
            );
          })()}
        </>
      ) : (
        <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Sistemde kayıtlı değil</div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {hovered && item.mannImageUrl && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: 8, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.6)", pointerEvents: "none", minWidth: 160 }}>
          <Image src={item.mannImageUrl} alt={item.mannCode} width={160} height={160} sizes="160px" style={{ width: 160, height: "auto", borderRadius: 6, display: "block", objectFit: "contain" }} />
          <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 4 }}>{item.mannFancyName ?? item.mannCode}</div>
          <div style={{ position: "absolute", bottom: -6, left: "50%", width: 12, height: 12, background: "#1a1a1a", border: "1px solid #333", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }} />
        </div>
      )}

      {item.mannProductId
        ? <Link href={`/urun/${item.mannCode}`} style={{ textDecoration: "none", display: "block" }}>{card}</Link>
        : card}
    </div>
  );
}

function FiltronCard({ item, icon }: { item: FilterItem; icon: string }) {
  const [hovered, setHovered] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const { addItem } = useCart();

  if (!item.filtronCode) return null;

  const inStock = item.filtronStock > 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.filtronProductId || pending) return;
    setPending(true);
    const res = await addItem(item.filtronProductId, 1);
    setPending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };

  const card = (
    <div style={{
      background: FILTRON.bg,
      border: `1px solid ${hovered ? FILTRON.borderHover : FILTRON.border}`,
      borderRadius: 8, padding: 14,
      cursor: item.filtronProductId ? "pointer" : "default",
      transition: "all .2s",
      transform: hovered ? "translateY(-1px)" : "none",
      boxShadow: hovered ? `0 4px 16px ${FILTRON.shadow}` : "none",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 6, right: 8, fontSize: 16, lineHeight: 1, color: "#888" }}>{icon}</div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 6, background: FILTRON.badge, padding: "2px 8px 2px 6px", borderRadius: 4, border: `1px solid ${FILTRON.badgeBorder}` }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: FILTRON.dot }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: FILTRON.text, letterSpacing: 1, textTransform: "uppercase" }}>FILTRON</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: FILTRON.text, margin: "2px 0", fontFamily: "monospace" }}>
        {item.filtronCode}
      </div>

      {item.filtronProductId ? (
        <>
          <div style={{ fontSize: 11, color: inStock ? "#52c07a" : "#e05252", marginTop: 4 }}>
            {inStock ? "● Stokta var" : "● Stokta yok"}
          </div>
          {item.filtronComparePrice && item.filtronComparePrice > item.filtronPrice && item.filtronPrice > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#666", textDecoration: "line-through" }}>
                ₺{item.filtronComparePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#e05252", background: "#2a0e0e", border: "1px solid #4a1818", padding: "1px 5px", borderRadius: 3 }}>
                %{Math.round(((item.filtronComparePrice - item.filtronPrice) / item.filtronComparePrice) * 100)}
              </span>
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginTop: 4 }}>
            {item.filtronPrice > 0
              ? `₺${item.filtronPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
              : "Fiyat sorunuz"}
          </div>
          {(() => {
            const canBuy = inStock && item.filtronPrice > 0;
            const label = canBuy
              ? (done ? "Eklendi ✓" : pending ? "Ekleniyor…" : "Sepete Ekle")
              : (!inStock ? "Tükendi" : "Fiyat sorunuz");
            return (
              <>
                <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Detayları gör →</div>
                <button
                  type="button"
                  onClick={canBuy ? handleAdd : undefined}
                  disabled={!canBuy || pending}
                  style={{
                    marginTop: 6, width: "100%",
                    background: !canBuy ? "#161616" : done ? "#52c07a" : pending ? "#5a6a80" : FILTRON.dot,
                    color: !canBuy ? "#666" : "#fff",
                    border: !canBuy ? "1px solid #222" : "none",
                    borderRadius: 4,
                    padding: "5px 8px", fontSize: 11, fontWeight: 600,
                    cursor: !canBuy ? "not-allowed" : pending ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              </>
            );
          })()}
        </>
      ) : (
        <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Sistemde kayıtlı değil</div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {hovered && item.filtronImageUrl && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: 8, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.6)", pointerEvents: "none", minWidth: 160 }}>
          <Image src={item.filtronImageUrl} alt={item.filtronCode ?? ""} width={160} height={160} sizes="160px" style={{ width: 160, height: "auto", borderRadius: 6, display: "block", objectFit: "contain" }} />
          <div style={{ fontSize: 9, color: FILTRON.text, textAlign: "center", marginTop: 4 }}>FILTRON {item.filtronCode}</div>
          <div style={{ position: "absolute", bottom: -6, left: "50%", width: 12, height: 12, background: "#1a1a1a", border: "1px solid #333", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }} />
        </div>
      )}

      {item.filtronProductId && item.filtronCode
        ? <Link href={`/urun/${item.filtronCode}`} style={{ textDecoration: "none", display: "block" }}>{card}</Link>
        : card}
    </div>
  );
}

const STORAGE_KEY = "filterWidget:selection";

export default function FilterWidget() {
  const [makes,   setMakes]   = useState<string[]>([]);
  const [models,  setModels]  = useState<string[]>([]);
  const [engines, setEngines] = useState<string[]>([]);
  const [make,    setMake]    = useState("");
  const [model,   setModel]   = useState("");
  const [engine,  setEngine]  = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    fetchJson<string[]>("/api/filters?type=makes").then(setMakes).catch(console.error);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const v = JSON.parse(saved) as { make?: string; model?: string; engine?: string };
        if (v.make)   setMake(v.make);
        if (v.model)  setModel(v.model);
        if (v.engine) setEngine(v.engine);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ make, model, engine }));
    } catch {}
  }, [make, model, engine]);

  // StoreHeader logosuna basıldığında "filterWidget:reset" event'i atılır — seçimleri temizle.
  useEffect(() => {
    function onReset() {
      setMake("");
      setModel("");
      setEngine("");
      setModels([]);
      setEngines([]);
      setResults(null);
    }
    window.addEventListener("filterWidget:reset", onReset);
    return () => window.removeEventListener("filterWidget:reset", onReset);
  }, []);

  useEffect(() => {
    setModels([]);
    if (!make) { setResults(null); return; }
    let cancelled = false;
    fetchJson<string[]>(`/api/filters?type=models&make=${encodeURIComponent(make)}`)
      .then((d) => { if (!cancelled) setModels(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [make]);

  useEffect(() => {
    setEngines([]);
    if (!model) { setResults(null); return; }
    let cancelled = false;
    fetchJson<string[]>(`/api/filters?type=engines&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then((d) => { if (!cancelled) setEngines(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    if (!engine) return;
    setLoading(true);
    setResults(null);
    let cancelled = false;
    fetchJson<Results | null>(
      `/api/filters?type=results&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&engine=${encodeURIComponent(engine)}`
    )
      .then((data) => { if (!cancelled) setResults(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const selStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "#1a1a1a", border: "none",
    borderRadius: 7, padding: "14px 36px 14px 16px", color: "#e5e5e5",
    fontSize: 15, outline: "none", cursor: "pointer", appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    display: "block",
  };
  const selWrap: React.CSSProperties = {
    background: "linear-gradient(135deg, #00A758, #FFED00)",
    borderRadius: 8, padding: "0.5px", display: "block",
  };
  const selWrapDisabled: React.CSSProperties = {
    background: "#2a2a2a",
    borderRadius: 8, padding: "0.5px", display: "block",
  };

  return (
    <div style={{ background: "linear-gradient(#131313, #131313) padding-box, linear-gradient(135deg, #00A758, #FFED00) border-box", border: "1px solid transparent", borderRadius: 14, padding: 32 }}>
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#e5e5e5" }}>Araç Bilgilerini Seçin</h3>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Marka, model ve motor seçerek uyumlu filtreleri görüntüleyin</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "MARKA",       value: make,   onChange: (v: string) => { setMake(v); setModel(""); setEngine(""); }, options: makes,   ph: "Marka seçin...",             disabled: false  },
          { label: "MODEL",       value: model,  onChange: (v: string) => { setModel(v); setEngine(""); },             options: models,  ph: make  ? "Model seçin..."   : "Önce marka seçin", disabled: !make  },
          { label: "MOTOR / GÜÇ", value: engine, onChange: setEngine,                                                 options: engines, ph: model ? "Motor seçin..."   : "Önce model seçin", disabled: !model },
        ].map(({ label, value, onChange, options, ph, disabled }) => (
          <div key={label}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
            <div style={disabled ? selWrapDisabled : selWrap}>
              <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
                style={{ ...selStyle, backgroundColor: disabled ? "#0e0e0e" : "#1a1a1a", color: disabled ? "#333" : "#e5e5e5", cursor: disabled ? "not-allowed" : "pointer" }}>
                <option value="">{ph}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {(make || model || engine) && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              setMake(""); setModel(""); setEngine("");
              setModels([]); setEngines([]); setResults(null);
              try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
            }}
            style={{
              fontSize: 12, color: "#aaa", background: "transparent",
              border: "1px solid #2a2a2a", borderRadius: 6,
              padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Seçimlerimi Temizle
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#555" }}>Aranıyor…</div>
      )}

      {results && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, background: "#8fa4c0", borderRadius: "50%" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>
                {results.vehicle.make} {results.vehicle.model} — {results.vehicle.engine}
              </span>
              {results.vehicle.ps && (
                <span style={{ fontSize: 11, color: "#8fa4c0", background: "#151e2a", padding: "2px 10px", borderRadius: 12 }}>
                  {results.vehicle.ps} PS / {results.vehicle.kw} kW
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: MANN.text }}>
                <div style={{ width: 8, height: 8, background: MANN.dot, borderRadius: 2 }} /> MANN-FILTER
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: FILTRON.text }}>
                <div style={{ width: 8, height: 8, background: FILTRON.dot, borderRadius: 2 }} /> FILTRON
              </div>
            </div>
          </div>

          {results.filterGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: 13 }}>Bu araç için ürün bulunamadı.</div>
          ) : (
            results.filterGroups.map((group) => (
              <div key={group.type} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{group.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#c8d8e8", letterSpacing: 0.2 }}>{group.label}</span>
                  <div style={{ flex: 1, height: 1, background: "#1e1e1e", marginLeft: 4 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {group.items.map((item, i) => (
                    <div key={i} style={{ display: "contents" }}>
                      <MannCard item={item} icon={group.icon} />
                      <FiltronCard item={item} icon={group.icon} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
