"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { CartActionResult } from "@/lib/cart/actions";

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "Giriş yapmanız gerekiyor.",
  INVALID_QUANTITY: "Geçersiz adet.",
  OUT_OF_STOCK: "Stokta yeterli ürün yok.",
  PRODUCT_NOT_FOUND: "Ürün bulunamadı.",
  NOT_IN_CART: "Ürün sepette değil.",
  DB_ERROR: "Bir hata oluştu, tekrar deneyin.",
};

function errorText(res: CartActionResult): string {
  if (res.ok) return "";
  return ERROR_MESSAGES[res.error] ?? "Bir hata oluştu.";
}

export default function AddToCart({
  productId,
  stock,
  hasPrice,
}: {
  productId: string;
  stock: number;
  hasPrice: boolean;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const inStock = stock > 0;
  const enabled = inStock && hasPrice;
  const max = Math.max(1, stock);

  if (!enabled) {
    return (
      <button
        disabled
        style={{
          display: "block", width: "100%",
          background: "#161616", color: "#444",
          border: "1px solid #222", borderRadius: 8,
          padding: "11px", fontSize: 14, fontWeight: 700,
          cursor: "not-allowed",
        }}
      >
        Şu an satışta değil
      </button>
    );
  }

  const handleAdd = async () => {
    setPending(true);
    setFeedback(null);
    const res = await addItem(productId, qty);
    setPending(false);
    if (res.ok) {
      setFeedback({ kind: "ok", text: `${qty} adet sepete eklendi` });
      setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback({ kind: "err", text: errorText(res) });
    }
  };

  const stepBtn = (disabled: boolean): React.CSSProperties => ({
    width: 36, height: 36,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: disabled ? "#0c0c0c" : "#1a1a1a",
    color: disabled ? "#333" : "#e5e5e5",
    border: "1px solid #2a2a2a", borderRadius: 6,
    fontSize: 16, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || pending}
            aria-label="Adet azalt"
            style={stepBtn(qty <= 1 || pending)}
          >
            −
          </button>
          <div style={{
            minWidth: 40, textAlign: "center",
            fontSize: 15, fontWeight: 600, color: "#e5e5e5",
            fontVariantNumeric: "tabular-nums",
          }}>
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max || pending}
            aria-label="Adet arttır"
            style={stepBtn(qty >= max || pending)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          style={{
            flex: 1,
            background: pending ? "#bfb000" : "#FFED00", color: "#0a0a0a",
            border: "none", borderRadius: 8,
            padding: "11px", fontSize: 14, fontWeight: 700,
            cursor: pending ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {pending ? "Ekleniyor…" : "Sepete Ekle"}
        </button>
      </div>
      {feedback && (
        <div style={{
          marginTop: 8, fontSize: 12,
          color: feedback.kind === "ok" ? "#52c07a" : "#e05252",
        }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
