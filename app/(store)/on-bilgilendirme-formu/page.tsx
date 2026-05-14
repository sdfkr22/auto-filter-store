import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import OnBilgilendirmeContent from "./Content";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "auto-filter ön bilgilendirme formu — mesafeli sözleşme öncesi alıcıya sunulan bilgiler.",
};

// TODO: Şirket bilgileri prod öncesi doldurulacak.

export default function OnBilgilendirmePage() {
  return (
    <LegalPageShell title="Ön Bilgilendirme Formu" lastUpdated="2026-05-14">
      <OnBilgilendirmeContent />
    </LegalPageShell>
  );
}
