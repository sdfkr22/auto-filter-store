"use client";

import { useState, useTransition } from "react";
import { submitContactForm } from "./actions";

export default function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await submitContactForm(formData);
      setResult(res);
    });
  }

  return (
    <form action={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Ad Soyad *</label>
          <input name="name" required style={input} disabled={pending} />
        </div>
        <div>
          <label style={label}>E-posta *</label>
          <input name="email" type="email" required style={input} disabled={pending} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={label}>Konu *</label>
        <input name="subject" required style={input} disabled={pending} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={label}>Mesajınız *</label>
        <textarea name="message" required rows={6} style={{ ...input, resize: "vertical", minHeight: 120 }} disabled={pending} />
      </div>

      {result && (
        <div style={result.ok ? successBox : errorBox}>
          {result.message}
        </div>
      )}

      <button type="submit" disabled={pending} style={btn(pending)}>
        {pending ? "Gönderiliyor…" : "Mesajı Gönder"}
      </button>
    </form>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#888",
  marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  border: "1px solid #222",
  borderRadius: 6,
  padding: "10px 12px",
  color: "#e5e5e5",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const btn = (disabled: boolean): React.CSSProperties => ({
  marginTop: 16,
  background: disabled ? "#1a1a1a" : "#FFED00",
  color: disabled ? "#555" : "#0a0a0a",
  border: "none",
  borderRadius: 6,
  padding: "11px 24px",
  fontSize: 14,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
});
const successBox: React.CSSProperties = {
  marginTop: 14,
  background: "#1a3a2a",
  border: "1px solid #2a5a40",
  color: "#7ad19a",
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: 13,
};
const errorBox: React.CSSProperties = {
  marginTop: 14,
  background: "#3a1a1a",
  border: "1px solid #5a2020",
  color: "#e05252",
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: 13,
};
