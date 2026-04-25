import type { Metadata } from "next";
import SifremiSifirlaForm from "./SifremiSifirlaForm";

export const metadata: Metadata = { title: "Şifre Sıfırla" };

export default function SifremiSifirlaPage() {
  return <SifremiSifirlaForm />;
}
