"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "./actions";

const s = {
  wrap: { minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" } as const,
  card: { width: "100%", maxWidth: 400, background: "#111", border: "1px solid #222", borderRadius: 12, padding: "40px 32px" } as const,
  logo: { textAlign: "center" as const, marginBottom: 32 },
  logoText: { fontSize: 22, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#8fa4c0" } as const,
  title: { fontSize: 20, fontWeight: 600, color: "#e5e5e5", marginBottom: 4, textAlign: "center" as const },
  sub: { fontSize: 13, color: "#666", textAlign: "center" as const, marginBottom: 28, lineHeight: 1.5 },
  success: { background: "#0e2a1a", border: "1px solid #1e5a3a", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: "#52c07a", marginBottom: 16, lineHeight: 1.5 } as const,
  label: { display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 } as const,
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", color: "#e5e5e5", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  fieldWrap: { marginBottom: 16 } as const,
  btn: { width: "100%", background: "#8fa4c0", color: "#090909", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 } as const,
  footer: { marginTop: 24, textAlign: "center" as const, fontSize: 13, color: "#666" },
  link: { color: "#8fa4c0", textDecoration: "none" } as const,
};

export default function SifremiUnuttumForm() {
  const [state, action, pending] = useActionState(resetPassword, { error: null, success: false });

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>
          <Link href="/" style={s.logoText}>auto<span style={s.logoDot}>-filter</span></Link>
        </div>
        <h1 style={s.title}>Şifremi Unuttum</h1>
        <p style={s.sub}>E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>

        {state.success ? (
          <div style={s.success}>
            <strong>Bağlantı gönderildi</strong><br />
            E-postanızı kontrol edin. Bağlantı 24 saat geçerlidir.
          </div>
        ) : (
          <form action={action}>
            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="email">E-posta</label>
              <input style={s.input} id="email" name="email" type="email" required autoComplete="email" placeholder="ornek@mail.com" />
            </div>
            <button style={s.btn} type="submit" disabled={pending}>
              {pending ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>
        )}

        <p style={s.footer}>
          <Link href="/giris" style={s.link}>← Giriş sayfasına dön</Link>
        </p>
      </div>
    </div>
  );
}
