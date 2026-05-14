"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { signOut } from "@/app/hesabim/actions";
import Logo from "@/components/Logo";
import SearchBox from "@/components/SearchBox";

export type StoreHeaderUser = {
  displayName: string | null;
} | null;

const s = {
  header: {
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    backgroundColor: "#090909",
    backgroundImage: "linear-gradient(90deg, #2a2a2a, #2a2a2a)",
    backgroundSize: "100% 0.5px",
    backgroundPosition: "bottom",
    backgroundRepeat: "no-repeat",
  } as const,
  logo: { fontSize: 20, fontWeight: 700, color: "#e5e5e5", textDecoration: "none" } as const,
  logoDot: { color: "#8fa4c0" } as const,
  nav: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, justifyContent: "flex-end" },
  navLink: { fontSize: 13, color: "#888", textDecoration: "none", padding: "6px 14px", borderRadius: 6 } as const,
  navLinkPrimary: {
    fontSize: 13, color: "#090909", textDecoration: "none",
    padding: "6px 16px", borderRadius: 6, background: "#FFED00", fontWeight: 600,
  } as const,
  greeting: { fontSize: 13, color: "#aaa", marginRight: 4 } as const,
  greetingName: { color: "#e5e5e5", fontWeight: 600 } as const,
  logoutBtn: {
    fontSize: 13, color: "#888", background: "transparent",
    border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 14px",
    cursor: "pointer", fontFamily: "inherit",
  } as const,
  cartLink: {
    position: "relative" as const,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 6,
    border: "1px solid #2a2a2a",
    background: "transparent",
    color: "#aaa",
    textDecoration: "none",
  } as const,
  cartBadge: {
    position: "absolute" as const,
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    padding: "0 5px",
    borderRadius: 9,
    background: "#FFED00",
    color: "#090909",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #090909",
  } as const,
};

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function StoreHeader({
  user,
  showProductsLink = true,
}: {
  user: StoreHeaderUser;
  showProductsLink?: boolean;
}) {
  const { count } = useCart();

  return (
    <header style={s.header}>
      <Link
        href="/"
        style={s.logo}
        aria-label="otofiltrem.com"
        onClick={() => {
          // Anasayfaya dönerken FilterWidget seçimini temizle. Aynı sayfadaysak Link re-mount yapmaz,
          // bu yüzden hem storage'ı temizle hem custom event ile widget'a haber ver.
          try { sessionStorage.removeItem("filterWidget:selection"); } catch {}
          window.dispatchEvent(new Event("filterWidget:reset"));
        }}
      >
        <Logo height={38} />
      </Link>
      <SearchBox />
      <nav style={s.nav}>
        {showProductsLink && (
          <Link href="/urunler" className="nav-link" style={s.navLink}>
            Ürünler
          </Link>
        )}

        <Link href="/sepet" className="nav-link" style={s.cartLink} aria-label={`Sepet (${count} ürün)`}>
          <CartIcon />
          {count > 0 && <span style={s.cartBadge}>{count > 99 ? "99+" : count}</span>}
        </Link>

        {user ? (
          <>
            <span style={s.greeting}>
              Hoşgeldin <span style={s.greetingName}>{user.displayName ?? "Kullanıcı"}</span>
            </span>
            <Link href="/hesabim" style={s.navLinkPrimary}>
              Hesabım
            </Link>
            <form action={signOut}>
              <button type="submit" className="nav-link" style={s.logoutBtn}>
                Çıkış Yap
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/giris" className="nav-link" style={s.navLink}>
              Giriş Yap
            </Link>
            <Link href="/kayit" style={s.navLinkPrimary}>
              Kayıt Ol
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
