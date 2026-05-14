import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import MesafeliSatisContent from "./Content";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "auto-filter mesafeli satış sözleşmesi — Türk Tüketici Kanunu kapsamında hak ve yükümlülükler.",
};

// TODO: Şirket bilgileri prod öncesi doldurulacak (unvan, vergi no, adres, telefon, e-posta).
// Bu metin Türk Tüketici Kanunu (6502) ve Mesafeli Sözleşmeler Yönetmeliği'ne dayanır.
// Yayına almadan önce bir avukata gözden geçirtin.

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <LegalPageShell title="Mesafeli Satış Sözleşmesi" lastUpdated="2026-05-14">
      <MesafeliSatisContent />
    </LegalPageShell>
  );
}
