"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function AddToCartButton({
  productId,
  enabled,
  outOfStockLabel,
}: {
  productId: string;
  enabled: boolean;
  outOfStockLabel: string;
}) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "block", width: "100%",
    border: "none", borderRadius: 6,
    padding: "8px 10px", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  };

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        style={{
          ...baseStyle,
          background: "#161616", color: "#444",
          border: "1px solid #222",
          cursor: "not-allowed",
        }}
      >
        {outOfStockLabel}
      </button>
    );
  }

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    const res = await addItem(productId, 1);
    setPending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      style={{
        ...baseStyle,
        background: done ? "#52c07a" : pending ? "#5a6a80" : "#8fa4c0",
        color: "#090909",
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {done ? "Eklendi ✓" : pending ? "Ekleniyor…" : "Sepete Ekle"}
    </button>
  );
}
