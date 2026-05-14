import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "auto-filter ile iletişime geçin — adres, telefon, e-posta ve mesaj formu.",
};

// TODO: Şirket bilgileri prod öncesi doldurulacak.

export default function IletisimPage() {
  return (
    <LegalPageShell title="İletişim">
      <p>
        Sorularınız, önerileriniz veya sipariş takibi için aşağıdaki kanallardan bize ulaşabilirsiniz.
        Mesai saatleri içinde en geç <strong>1 iş günü</strong> içinde dönüş yapıyoruz.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <div style={infoCard}>
          <div style={infoLabel}>📞 Telefon</div>
          <div style={infoValue}>[TBD]</div>
          <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Hafta içi 09:00 – 18:00</div>
        </div>
        <div style={infoCard}>
          <div style={infoLabel}>✉️ E-posta</div>
          <div style={infoValue}>[TBD]</div>
          <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>7/24 cevaplıyoruz</div>
        </div>
        <div style={infoCard}>
          <div style={infoLabel}>📍 Adres</div>
          <div style={{ ...infoValue, fontSize: 14 }}>[Adres — TBD]</div>
        </div>
        <div style={infoCard}>
          <div style={infoLabel}>🏢 Şirket Bilgisi</div>
          <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>
            Unvan: [TBD]<br />
            Vergi Dairesi / No: [TBD]<br />
            Mersis No: [TBD]
          </div>
        </div>
      </div>

      <h2 style={h2}>Bize Yazın</h2>
      <ContactForm />
    </LegalPageShell>
  );
}

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 36, marginBottom: 14 };
const infoCard: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 18,
};
const infoLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  fontWeight: 600,
};
const infoValue: React.CSSProperties = {
  fontSize: 16,
  color: "#fff",
  fontWeight: 600,
};
