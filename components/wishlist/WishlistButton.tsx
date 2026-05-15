"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

type Variant = "icon" | "icon-floating";

const styles = {
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 6,
    border: "1px solid #2a2a2a",
    background: "transparent",
    color: "#aaa",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.15s, background 0.15s, border-color 0.15s",
  } as const,
  iconFloating: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid #2a2a2a",
    background: "rgba(9, 9, 9, 0.85)",
    color: "#aaa",
    cursor: "pointer",
    padding: 0,
    backdropFilter: "blur(4px)",
    transition: "color 0.15s, background 0.15s, border-color 0.15s",
    zIndex: 2,
  } as const,
  active: {
    color: "#ff5a6e",
    borderColor: "#ff5a6e",
  } as const,
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function WishlistButton({
  productId,
  variant = "icon",
}: {
  productId: string;
  variant?: Variant;
}) {
  const router = useRouter();
  const { has, toggle, isAuthenticated } = useWishlist();
  const [busy, setBusy] = useState(false);
  const active = has(productId);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!isAuthenticated) {
      router.push(`/giris?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    try {
      await toggle(productId);
    } finally {
      setBusy(false);
    }
  }

  const base = variant === "icon-floating" ? styles.iconFloating : styles.icon;
  const style = active ? { ...base, ...styles.active } : base;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={style}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
