import type { Metadata } from "next";
import GirisForm from "./GirisForm";

export const metadata: Metadata = { title: "Giriş Yap" };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <GirisForm next={next} urlError={error} />;
}
