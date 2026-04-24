import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "auto-filter | MANN-FILTER & FILTRON Filtre Mağazası",
    template: "%s | auto-filter",
  },
  description: "Aracınıza uygun MANN-FILTER ve FILTRON yağ, hava, polen ve yakıt filtrelerini bulun ve satın alın.",
  keywords: ["mann filter", "filtron", "yağ filtresi", "hava filtresi", "polen filtresi", "yakıt filtresi", "oto filtre"],
  openGraph: {
    siteName: "auto-filter",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body style={{ background: "#090909", color: "#e5e5e5", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
