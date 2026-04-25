import type { Metadata } from "next";
import KayitForm from "./KayitForm";

export const metadata: Metadata = { title: "Kayıt Ol" };

export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <KayitForm next={next} />;
}
