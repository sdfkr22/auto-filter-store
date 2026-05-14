"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
} from "./actions";

type Address = {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  full_address: string;
  city: string;
  district: string;
  zip: string | null;
  is_default: boolean;
};

const s = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 } as const,
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column" as const, gap: 6 },
  cardDefault: { background: "#FFED0008", border: "1px solid #FFED0040", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column" as const, gap: 6 },
  badgeDefault: { fontSize: 10, color: "#FFED00", textTransform: "uppercase" as const, letterSpacing: 0.5, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 14, fontWeight: 700, color: "#e5e5e5" } as const,
  line: { fontSize: 12, color: "#aaa", lineHeight: 1.5 } as const,
  actions: { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" as const },
  btn: { background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "5px 11px", color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "inherit" } as const,
  btnDanger: { background: "transparent", border: "1px solid #5a2020", borderRadius: 6, padding: "5px 11px", color: "#d17a7a", fontSize: 11, cursor: "pointer", fontFamily: "inherit" } as const,
  newBtn: { display: "block", width: "100%", marginBottom: 16, background: "transparent", border: "1px dashed #2a2a2a", borderRadius: 10, padding: 16, color: "#888", fontSize: 14, cursor: "pointer", fontFamily: "inherit" } as const,
  formCard: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 22, marginBottom: 18 } as const,
  formTitle: { fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginBottom: 16 } as const,
  label: { display: "block", fontSize: 12, color: "#888", marginBottom: 5 } as const,
  input: { width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "9px 11px", color: "#e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
  field: { marginBottom: 10 } as const,
  primaryBtn: (disabled: boolean) => ({ background: disabled ? "#1a1a1a" : "#FFED00", color: disabled ? "#555" : "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" }) as const,
  ghostBtn: { background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 18px", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginRight: 8 } as const,
  error: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#e05252", marginBottom: 10 } as const,
  empty: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: 40, textAlign: "center" as const, color: "#666", fontSize: 13 },
};

type FormMode = { kind: "new" } | { kind: "edit"; address: Address } | null;

export default function AdreslerView({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormMode>(addresses.length === 0 ? { kind: "new" } : null);
  const [err, setErr] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, onSuccess?: () => void) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) { setErr(res.error); return; }
      onSuccess?.();
      router.refresh();
    });
  }

  async function handleSubmit(formData: FormData) {
    if (!form) return;
    if (form.kind === "new") {
      run(() => createUserAddress(formData), () => setForm(null));
    } else {
      run(() => updateUserAddress(form.address.id, formData), () => setForm(null));
    }
  }

  return (
    <>
      {form === null && (
        <button type="button" onClick={() => setForm({ kind: "new" })} style={s.newBtn}>
          + Yeni adres ekle
        </button>
      )}

      {form && (
        <div style={s.formCard}>
          <div style={s.formTitle}>{form.kind === "new" ? "Yeni Adres" : "Adresi Düzenle"}</div>
          {err && <div style={s.error}>{err}</div>}
          <form action={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Adres Başlığı</label>
              <input style={s.input} name="title" defaultValue={form.kind === "edit" ? form.address.title : ""} placeholder="Ev / İş" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={s.field}>
                <label style={s.label}>Ad Soyad</label>
                <input style={s.input} name="full_name" defaultValue={form.kind === "edit" ? form.address.full_name : ""} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Telefon</label>
                <input style={s.input} name="phone" defaultValue={form.kind === "edit" ? form.address.phone : ""} required />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Açık Adres</label>
              <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} name="full_address" defaultValue={form.kind === "edit" ? form.address.full_address : ""} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={s.field}>
                <label style={s.label}>İl</label>
                <input style={s.input} name="city" defaultValue={form.kind === "edit" ? form.address.city : ""} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>İlçe</label>
                <input style={s.input} name="district" defaultValue={form.kind === "edit" ? form.address.district : ""} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Posta Kodu</label>
                <input style={s.input} name="zip" defaultValue={form.kind === "edit" ? form.address.zip ?? "" : ""} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="button" onClick={() => { setForm(null); setErr(null); }} style={s.ghostBtn} disabled={pending}>İptal</button>
              <button type="submit" disabled={pending} style={s.primaryBtn(pending)}>
                {pending ? "Kaydediliyor…" : (form.kind === "new" ? "Adresi Kaydet" : "Güncelle")}
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && form === null ? (
        <div style={s.empty}>
          Henüz kayıtlı adresiniz yok.
        </div>
      ) : (
        <div style={s.grid}>
          {addresses.map((a) => (
            <div key={a.id} style={a.is_default ? s.cardDefault : s.card}>
              {a.is_default && <div style={s.badgeDefault}>Varsayılan</div>}
              <div style={s.title}>{a.title}</div>
              <div style={s.line}>{a.full_name}</div>
              <div style={s.line}>{a.full_address}</div>
              <div style={s.line}>{a.district}, {a.city}{a.zip ? ` ${a.zip}` : ""}</div>
              <div style={{ ...s.line, color: "#888" }}>{a.phone}</div>
              <div style={s.actions}>
                <button type="button" onClick={() => { setForm({ kind: "edit", address: a }); setErr(null); }} style={s.btn} disabled={pending}>
                  Düzenle
                </button>
                {!a.is_default && (
                  <button type="button" onClick={() => run(() => setDefaultAddress(a.id))} style={s.btn} disabled={pending}>
                    Varsayılan Yap
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Bu adresi silmek istediğinizden emin misiniz?")) {
                      run(() => deleteUserAddress(a.id));
                    }
                  }}
                  style={s.btnDanger}
                  disabled={pending}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {err && form === null && <div style={s.error}>{err}</div>}
    </>
  );
}
