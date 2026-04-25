import type { Metadata } from "next";
import SifremiUnuttumForm from "./SifremiUnuttumForm";

export const metadata: Metadata = { title: "Şifremi Unuttum" };

export default function SifremiUnuttumPage() {
  return <SifremiUnuttumForm />;
}
