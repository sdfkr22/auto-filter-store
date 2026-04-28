"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

const MANN = {
  bg: "linear-gradient(135deg, #141a08, #121a0a)",
  border: "#2a3a15",
  borderHover: "#78a22f",
  badge: "#78a22f18",
  badgeBorder: "#78a22f25",
  dot: "#78a22f",
  text: "#78a22f",
  shadow: "rgba(120,162,47,0.25)",
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
      <div style={{ position: "absolute", top: 0, right: 0, background: MANN.dot, borderRadius: "0 8px 0 12px", padding: "6px 10px", fontSize: 16, lineHeight: 1, color: "#fff" }}>{icon}</div>
      <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 24, opacity: 0.06, fontWeight: 900, color: "#fff", pointerEvents: "none", userSelect: "none" }}>M</div>

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
          {item.mannProductId && (
            inStock && item.mannPrice > 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                disabled={pending}
                style={{
                  marginTop: 8, width: "100%",
                  background: done ? "#52c07a" : pending ? "#5a6a80" : MANN.dot,
                  color: "#fff",
                  border: "none", borderRadius: 5,
                  padding: "6px 8px", fontSize: 11, fontWeight: 700,
                  cursor: pending ? "wait" : "pointer", fontFamily: "inherit",
                }}
              >
                {done ? "Eklendi ✓" : pending ? "Ekleniyor…" : "Sepete Ekle"}
              </button>
            ) : (
              <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Detayları gör →</div>
            )
          )}
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
      <div style={{ position: "absolute", top: 0, right: 0, background: FILTRON.dot, borderRadius: "0 8px 0 12px", padding: "6px 10px", fontSize: 16, lineHeight: 1, color: "#fff" }}>{icon}</div>
      <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 24, opacity: 0.06, fontWeight: 900, color: "#fff", pointerEvents: "none", userSelect: "none" }}>F</div>

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
          {inStock && item.filtronPrice > 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending}
              style={{
                marginTop: 8, width: "100%",
                background: done ? "#52c07a" : pending ? "#5a6a80" : FILTRON.dot,
                color: "#fff",
                border: "none", borderRadius: 5,
                padding: "6px 8px", fontSize: 11, fontWeight: 700,
                cursor: pending ? "wait" : "pointer", fontFamily: "inherit",
              }}
            >
              {done ? "Eklendi ✓" : pending ? "Ekleniyor…" : "Sepete Ekle"}
            </button>
          ) : (
            <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Detayları gör →</div>
          )}
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
  }, []);

  useEffect(() => {
    setModel(""); setEngine(""); setModels([]); setEngines([]); setResults(null);
    if (!make) return;
    fetchJson<string[]>(`/api/filters?type=models&make=${encodeURIComponent(make)}`)
      .then(setModels).catch(console.error);
  }, [make]);

  useEffect(() => {
    setEngine(""); setEngines([]); setResults(null);
    if (!model) return;
    fetchJson<string[]>(`/api/filters?type=engines&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then(setEngines).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    if (!engine) return;
    setLoading(true);
    setResults(null);
    fetchJson<Results | null>(
      `/api/filters?type=results&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&engine=${encodeURIComponent(engine)}`
    )
      .then((data) => setResults(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const selStyle: React.CSSProperties = {
    width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: 6, padding: "9px 26px 9px 11px", color: "#e5e5e5",
    fontSize: 13, outline: "none", cursor: "pointer", appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
  };

  return (
    <div style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, color: "#e5e5e5" }}>Araç Bilgilerini Seçin</h3>
      <p style={{ color: "#555", fontSize: 11, marginBottom: 16 }}>Marka, model ve motor seçerek uyumlu filtreleri görüntüleyin</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "MARKA",       value: make,   onChange: (v: string) => { setMake(v); setModel(""); setEngine(""); }, options: makes,   ph: "Marka seçin...",             disabled: false  },
          { label: "MODEL",       value: model,  onChange: (v: string) => { setModel(v); setEngine(""); },             options: models,  ph: make  ? "Model seçin..."   : "Önce marka seçin", disabled: !make  },
          { label: "MOTOR / GÜÇ", value: engine, onChange: setEngine,                                                 options: engines, ph: model ? "Motor seçin..."   : "Önce model seçin", disabled: !model },
        ].map(({ label, value, onChange, options, ph, disabled }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
              style={{ ...selStyle, background: disabled ? "#0e0e0e" : "#1a1a1a", color: disabled ? "#333" : "#e5e5e5", cursor: disabled ? "not-allowed" : "pointer" }}>
              <option value="">{ph}</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

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
