"use client";

import { useActionState } from "react";
import { updateProfile, updatePassword } from "../actions";

const s = {
  section: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: 22, marginBottom: 20 } as const,
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginBottom: 16 } as const,
  label: { display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 } as const,
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", color: "#e5e5e5", fontSize: 14, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
  inputReadonly: { width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px", color: "#666", fontSize: 14, boxSizing: "border-box" as const, fontFamily: "inherit" },
  fieldWrap: { marginBottom: 14 } as const,
  btn: (pending: boolean) => ({
    background: pending ? "#1a1a1a" : "#8fa4c0",
    color: pending ? "#555" : "#090909",
    border: "none",
    borderRadius: 8,
    padding: "10px 28px",
    fontSize: 14,
    fontWeight: 600,
    cursor: pending ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  }),
  error: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e05252", marginBottom: 14 } as const,
  success: { background: "#0e2a1a", border: "1px solid #1e5a3a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#52c07a", marginBottom: 14 } as const,
};

export default function ProfilForm({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { error: null, success: false });
  const [pwState, pwAction, pwPending] = useActionState(updatePassword, { error: null, success: false });

  return (
    <>
      <form action={profileAction} style={s.section}>
        <div style={s.sectionTitle}>Kişisel Bilgiler</div>

        <div style={s.fieldWrap}>
          <label style={s.label}>E-posta</label>
          <input style={s.inputReadonly} type="email" defaultValue={email} readOnly />
        </div>

        <div style={s.fieldWrap}>
          <label style={s.label} htmlFor="full_name">Ad Soyad</label>
          <input style={s.input} id="full_name" name="full_name" type="text" defaultValue={fullName} required />
        </div>

        <div style={s.fieldWrap}>
          <label style={s.label} htmlFor="phone">Telefon</label>
          <input style={s.input} id="phone" name="phone" type="tel" defaultValue={phone} placeholder="05XX XXX XX XX" />
        </div>

        {profileState.error && <div style={s.error}>{profileState.error}</div>}
        {profileState.success && <div style={s.success}>Bilgiler güncellendi.</div>}

        <button style={s.btn(profilePending)} type="submit" disabled={profilePending}>
          {profilePending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>

      <form action={pwAction} style={s.section}>
        <div style={s.sectionTitle}>Şifre Değiştir</div>

        <div style={s.fieldWrap}>
          <label style={s.label} htmlFor="password">Yeni Şifre</label>
          <input style={s.input} id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>

        <div style={s.fieldWrap}>
          <label style={s.label} htmlFor="password_repeat">Yeni Şifre (Tekrar)</label>
          <input style={s.input} id="password_repeat" name="password_repeat" type="password" minLength={8} required autoComplete="new-password" />
        </div>

        {pwState.error && <div style={s.error}>{pwState.error}</div>}
        {pwState.success && <div style={s.success}>Şifre güncellendi.</div>}

        <button style={s.btn(pwPending)} type="submit" disabled={pwPending}>
          {pwPending ? "Güncelleniyor…" : "Şifreyi Güncelle"}
        </button>
      </form>
    </>
  );
}
