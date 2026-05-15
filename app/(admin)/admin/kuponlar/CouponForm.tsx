"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCoupon, updateCoupon, deleteCoupon, toggleCouponActive } from "@/lib/admin/coupon-actions";

type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
};

const s = {
  card: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 24 } as const,
  field: { marginBottom: 14 } as const,
  label: { display: "block", fontSize: 12, color: "#888", marginBottom: 6 } as const,
  input: {
    width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 6,
    padding: "9px 12px", color: "#e5e5e5", fontSize: 13, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box" as const,
  } as const,
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const,
  hint: { fontSize: 11, color: "#666", marginTop: 4 } as const,
  primary: (disabled: boolean) => ({
    background: disabled ? "#1a1a1a" : "#FFED00",
    color: disabled ? "#555" : "#0a0a0a",
    border: "none", borderRadius: 6, padding: "10px 20px",
    fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit",
  }) as const,
  ghost: {
    background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6,
    padding: "10px 16px", color: "#aaa", fontSize: 13, cursor: "pointer",
    fontFamily: "inherit",
  } as const,
  danger: {
    background: "transparent", border: "1px solid #5a2020", borderRadius: 6,
    padding: "10px 16px", color: "#e05252", fontSize: 13, cursor: "pointer",
    fontFamily: "inherit",
  } as const,
  err: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#e05252", marginBottom: 12 } as const,
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CouponForm({ coupon }: { coupon?: CouponRow }) {
  const router = useRouter();
  const isEdit = !!coupon;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [type, setType] = useState<"percent" | "fixed">(coupon?.type ?? "percent");

  async function onSubmit(fd: FormData) {
    setBusy(true);
    setErr(null);
    const res = isEdit
      ? await updateCoupon(coupon!.id, fd)
      : await createCoupon(fd);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    router.push("/admin/kuponlar");
    router.refresh();
  }

  async function onToggle() {
    if (!coupon) return;
    setBusy(true);
    await toggleCouponActive(coupon.id, !coupon.active);
    setBusy(false);
    router.refresh();
  }

  async function onDelete() {
    if (!coupon) return;
    if (!confirm(`${coupon.code} kuponunu silmek istediğine emin misin?`)) return;
    setBusy(true);
    const res = await deleteCoupon(coupon.id);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    router.push("/admin/kuponlar");
    router.refresh();
  }

  return (
    <form action={onSubmit} style={s.card}>
      {err && <div style={s.err}>{err}</div>}

      <div style={s.field}>
        <label style={s.label}>Kupon Kodu</label>
        <input
          name="code"
          required
          defaultValue={coupon?.code ?? ""}
          placeholder="YAZ2026"
          style={{ ...s.input, textTransform: "uppercase", fontFamily: "monospace" }}
        />
        <div style={s.hint}>Sadece harf/rakam. Otomatik büyük harfe çevrilir.</div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>İndirim Tipi</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            style={s.input}
          >
            <option value="percent">Yüzde (%)</option>
            <option value="fixed">Sabit TL (₺)</option>
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Değer {type === "percent" ? "(%)" : "(₺)"}</label>
          <input
            type="number"
            name="value"
            required
            step={type === "percent" ? "1" : "0.01"}
            min="0"
            max={type === "percent" ? "100" : undefined}
            defaultValue={coupon?.value ?? ""}
            style={s.input}
          />
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Min. Sipariş Tutarı (₺)</label>
          <input
            type="number"
            name="min_order_amount"
            step="0.01"
            min="0"
            defaultValue={coupon?.min_order_amount ?? 0}
            style={s.input}
          />
          <div style={s.hint}>0 = limit yok.</div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Maks. Kullanım</label>
          <input
            type="number"
            name="max_uses"
            min="1"
            defaultValue={coupon?.max_uses ?? ""}
            placeholder="Sınırsız"
            style={s.input}
          />
          {coupon && (
            <div style={s.hint}>Şu ana dek: {coupon.used_count} kullanım.</div>
          )}
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Başlangıç</label>
          <input
            type="datetime-local"
            name="valid_from"
            defaultValue={toLocalInput(coupon?.valid_from ?? null)}
            style={s.input}
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>Bitiş</label>
          <input
            type="datetime-local"
            name="valid_until"
            defaultValue={toLocalInput(coupon?.valid_until ?? null)}
            style={s.input}
          />
        </div>
      </div>

      <div style={s.field}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#e5e5e5", cursor: "pointer" }}>
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={coupon?.active ?? true}
          />
          Aktif
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
        <button type="submit" disabled={busy} style={s.primary(busy)}>
          {busy ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Oluştur"}
        </button>
        <button type="button" onClick={() => router.push("/admin/kuponlar")} style={s.ghost} disabled={busy}>
          İptal
        </button>
        {isEdit && (
          <>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onToggle} style={s.ghost} disabled={busy}>
              {coupon!.active ? "Pasife al" : "Aktife al"}
            </button>
            <button type="button" onClick={onDelete} style={s.danger} disabled={busy}>
              Sil
            </button>
          </>
        )}
      </div>
    </form>
  );
}
