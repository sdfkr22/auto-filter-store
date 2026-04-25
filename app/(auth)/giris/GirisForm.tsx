"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signInWithGoogle } from "./actions";

const s = {
  wrap: { minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" } as const,
  card: { width: "100%", maxWidth: 400, background: "#111", border: "1px solid #222", borderRadius: 12, padding: "40px 32px" } as const,
  logo: { textAlign: "center" as const, marginBottom: 32 },
  logoText: { fontSize: 22, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#8fa4c0" } as const,
  title: { fontSize: 20, fontWeight: 600, color: "#e5e5e5", marginBottom: 4, textAlign: "center" as const },
  sub: { fontSize: 13, color: "#666", textAlign: "center" as const, marginBottom: 28 },
  error: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e05252", marginBottom: 16 } as const,
  info: { background: "#0e1a2a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#8fa4c0", marginBottom: 16 } as const,
  label: { display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 } as const,
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", color: "#e5e5e5", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  fieldWrap: { marginBottom: 16 } as const,
  btn: { width: "100%", background: "#8fa4c0", color: "#090909", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 } as const,
  btnGoogle: { width: "100%", background: "transparent", color: "#e5e5e5", border: "1px solid #2a2a2a", borderRadius: 8, padding: "11px", fontSize: 14, cursor: "pointer", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } as const,
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "20px 0" } as const,
  dividerLine: { flex: 1, height: 1, background: "#222" } as const,
  dividerText: { fontSize: 12, color: "#555" } as const,
  footer: { marginTop: 24, textAlign: "center" as const, fontSize: 13, color: "#666" },
  link: { color: "#8fa4c0", textDecoration: "none" } as const,
};

const urlErrors: Record<string, string> = {
  auth_error: "Doğrulama başarısız. Lütfen tekrar deneyin.",
};

export default function GirisForm({
  next,
  urlError,
}: {
  next?: string;
  urlError?: string;
}) {
  const [state, action, pending] = useActionState(signIn, { error: null });

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>
          <Link href="/" style={s.logoText}>
            auto<span style={s.logoDot}>-filter</span>
          </Link>
        </div>
        <h1 style={s.title}>Giriş Yap</h1>
        <p style={s.sub}>Hesabınıza erişin</p>

        {urlError && urlErrors[urlError] && (
          <div style={s.error}>{urlErrors[urlError]}</div>
        )}
        {state.error && <div style={s.error}>{state.error}</div>}

        <form action={action}>
          {next && <input type="hidden" name="next" value={next} />}

          <div style={s.fieldWrap}>
            <label style={s.label} htmlFor="email">E-posta</label>
            <input style={s.input} id="email" name="email" type="email" required autoComplete="email" placeholder="ornek@mail.com" />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label} htmlFor="password">Şifre</label>
            <input style={s.input} id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </div>

          <div style={{ textAlign: "right", marginBottom: 4, marginTop: -8 }}>
            <Link href="/sifremi-unuttum" style={{ ...s.link, fontSize: 12 }}>Şifremi unuttum</Link>
          </div>

          <button style={s.btn} type="submit" disabled={pending}>
            {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>veya</span>
          <div style={s.dividerLine} />
        </div>

        <form action={signInWithGoogle}>
          {next && <input type="hidden" name="next" value={next} />}
          <button style={s.btnGoogle} type="submit">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google ile Giriş Yap
          </button>
        </form>

        <p style={s.footer}>
          Hesabınız yok mu?{" "}
          <Link href={`/kayit${next ? `?next=${encodeURIComponent(next)}` : ""}`} style={s.link}>
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
