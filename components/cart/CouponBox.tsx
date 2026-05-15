"use client";

import { useEffect, useState } from "react";
import { validateCouponForCart, type CouponInfo } from "@/lib/coupon/actions";

const STORAGE_KEY = "auto-filter:coupon";
const EVENT = "auto-filter:coupon-changed";

export type AppliedCoupon = { code: string; coupon: CouponInfo; discount: number };

export function readAppliedCoupon(): AppliedCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.code !== "string") return null;
    return data as AppliedCoupon;
  } catch {
    return null;
  }
}

export function writeAppliedCoupon(c: AppliedCoupon | null) {
  if (typeof window === "undefined") return;
  if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useAppliedCoupon(): AppliedCoupon | null {
  const [c, setC] = useState<AppliedCoupon | null>(null);
  useEffect(() => {
    setC(readAppliedCoupon());
    const onChange = () => setC(readAppliedCoupon());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return c;
}

export default function CouponBox() {
  const applied = useAppliedCoupon();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await validateCouponForCart(code);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    writeAppliedCoupon({ code: res.coupon.code, coupon: res.coupon, discount: res.discount });
    setCode("");
  }

  function remove() {
    writeAppliedCoupon(null);
    setErr(null);
  }

  if (applied) {
    return (
      <div style={{
        marginTop: 14, padding: 12, borderRadius: 8,
        background: "#0a1810", border: "1px solid #1e4030",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#52c07a", fontFamily: "monospace" }}>
              ✓ {applied.coupon.code}
            </div>
            <div style={{ fontSize: 11, color: "#6a8070", marginTop: 2 }}>
              {applied.coupon.type === "percent"
                ? `%${applied.coupon.value} indirim`
                : `₺${applied.coupon.value.toLocaleString("tr-TR")} indirim`}
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            style={{
              background: "transparent", border: "1px solid #2a4030",
              color: "#6a8070", padding: "5px 10px", borderRadius: 5,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Kaldır
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={apply} style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(null); }}
          placeholder="Kupon kodu"
          autoCapitalize="characters"
          style={{
            flex: 1, background: "#0a0a0a", border: "1px solid #1f1f1f",
            borderRadius: 6, padding: "8px 12px", color: "#e5e5e5",
            fontSize: 12, outline: "none", fontFamily: "inherit",
            textTransform: "uppercase",
          }}
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          style={{
            background: busy ? "#222" : "#1a1a1a",
            color: code.trim() ? "#e5e5e5" : "#444",
            border: "1px solid #2a2a2a", borderRadius: 6,
            padding: "8px 14px", fontSize: 12, fontWeight: 600,
            cursor: busy || !code.trim() ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {busy ? "…" : "Uygula"}
        </button>
      </div>
      {err && <div style={{ fontSize: 11, color: "#e05252", marginTop: 6 }}>{err}</div>}
    </form>
  );
}
