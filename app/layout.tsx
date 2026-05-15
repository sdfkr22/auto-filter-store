import type { Metadata } from "next";
import "./globals.css";
import CartProvider from "@/components/cart/CartProvider";
import WishlistProvider from "@/components/wishlist/WishlistProvider";
import { getCurrentUser } from "@/lib/auth/user";
import { getCart } from "@/lib/cart/actions";
import { getWishlistIds } from "@/lib/wishlist/actions";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const [initialItems, initialWishlistIds] = await Promise.all([
    user ? getCart() : Promise.resolve([]),
    user ? getWishlistIds() : Promise.resolve([]),
  ]);

  return (
    <html lang="tr">
      <body style={{ background: "#090909", color: "#e5e5e5", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh" }}>
        <CartProvider isAuthenticated={!!user} initialItems={initialItems}>
          <WishlistProvider isAuthenticated={!!user} initialIds={initialWishlistIds}>
            {children}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
