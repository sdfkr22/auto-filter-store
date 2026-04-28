"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

const FREE_SHIPPING_THRESHOLD = 0; // V2.5'te shipping_methods'tan dinamik gelecek

function fmt(amount: number) {
  return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
}

export default function CartView() {
  const { items, count, total, loading, isAuthenticated, updateQty, removeItem } = useCart();

  if (loading) {
    return <div style={{ color: "#555", fontSize: 14, padding: "40px 0", textAlign: "center" }}>Sepet yükleniyor…</div>;
  }

  if (count === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "60px 20px",
        background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12,
      }}>
        <div style={{ fontSize: 32, marginBottom: 14 }}>🛒</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Sepetiniz boş</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 22 }}>
          Sepetinize henüz ürün eklemediniz.
        </div>
        <Link
          href="/urunler"
          style={{
            display: "inline-block",
            background: "#8fa4c0", color: "#090909",
            padding: "10px 22px", borderRadius: 8,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}
        >
          Ürünleri keşfet
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <CartRow
            key={item.productId}
            item={item}
            onChange={(qty) => updateQty(item.productId, qty)}
            onRemove={() => removeItem(item.productId)}
          />
        ))}
      </div>

      <aside style={{
        background: "#0c0c0c", border: "1px solid #1a1a1a",
        borderRadius: 12, padding: 20,
        position: "sticky", top: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#e5e5e5" }}>Sipariş Özeti</div>

        <Row label={`Ara toplam (${count} ürün)`} value={fmt(total)} />
        <Row label="Kargo" value={<span style={{ color: "#666" }}>Ödeme adımında</span>} />

        <div style={{ height: 1, background: "#1a1a1a", margin: "12px 0" }} />

        <Row
          label={<span style={{ fontWeight: 700, color: "#e5e5e5" }}>Toplam</span>}
          value={<span style={{ fontWeight: 700, color: "#e5e5e5", fontSize: 18 }}>{fmt(total)}</span>}
        />

        {isAuthenticated ? (
          <Link
            href="/odeme"
            style={{
              display: "block", marginTop: 18, textAlign: "center",
              background: "#8fa4c0", color: "#090909",
              padding: "11px", borderRadius: 8,
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Ödemeye Geç →
          </Link>
        ) : (
          <>
            <Link
              href="/giris?next=/odeme"
              style={{
                display: "block", marginTop: 18, textAlign: "center",
                background: "#8fa4c0", color: "#090909",
                padding: "11px", borderRadius: 8,
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}
            >
              Giriş yap & Ödemeye Geç
            </Link>
            <div style={{ fontSize: 11, color: "#555", marginTop: 10, textAlign: "center" }}>
              Sepetiniz giriş yaptıktan sonra otomatik aktarılır.
            </div>
          </>
        )}

        {FREE_SHIPPING_THRESHOLD > 0 && total < FREE_SHIPPING_THRESHOLD && (
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
            Ücretsiz kargo için {fmt(FREE_SHIPPING_THRESHOLD - total)} daha ekleyin.
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#aaa", padding: "6px 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CartRow({
  item,
  onChange,
  onRemove,
}: {
  item: ReturnType<typeof useCart>["items"][number];
  onChange: (qty: number) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMann = item.productType === "mann";
  const lineTotal = item.price * item.quantity;

  const wrap = async (op: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = (await op()) as { ok: boolean; error?: string } | undefined;
    setPending(false);
    if (result && !result.ok && result.error) {
      const msg: Record<string, string> = {
        OUT_OF_STOCK: "Stokta yeterli ürün yok.",
        DB_ERROR: "Bir hata oluştu, tekrar deneyin.",
      };
      setError(msg[result.error] ?? "Bir hata oluştu.");
    }
  };

  const stepBtn = (disabled: boolean): React.CSSProperties => ({
    width: 30, height: 30,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: disabled ? "#0c0c0c" : "#1a1a1a",
    color: disabled ? "#333" : "#e5e5e5",
    border: "1px solid #2a2a2a", borderRadius: 5,
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10,
      padding: 14, display: "flex", gap: 14, alignItems: "center",
    }}>
      <div style={{
        width: 70, height: 70, flexShrink: 0,
        background: "#111", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill sizes="70px" style={{ objectFit: "contain", padding: 6 }} />
        ) : (
          <span style={{ color: "#333", fontSize: 18 }}>⬡</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/urun/${item.productName}`} style={{ color: "#e5e5e5", textDecoration: "none" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: isMann ? "#4a8a5a" : "#4a7aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {isMann ? "MANN-FILTER" : "FİLTRON"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", fontFamily: "monospace", marginTop: 2 }}>
            {item.productName}
          </div>
          {item.productFancyName && item.productFancyName !== item.productName && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.productFancyName}
            </div>
          )}
        </Link>
        {error && <div style={{ fontSize: 10, color: "#e05252", marginTop: 4 }}>{error}</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <button type="button" disabled={pending || item.quantity <= 1} onClick={() => wrap(() => onChange(item.quantity - 1))} style={stepBtn(pending || item.quantity <= 1)} aria-label="Azalt">−</button>
        <div style={{ minWidth: 28, textAlign: "center", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {item.quantity}
        </div>
        <button type="button" disabled={pending || item.quantity >= item.stock} onClick={() => wrap(() => onChange(item.quantity + 1))} style={stepBtn(pending || item.quantity >= item.stock)} aria-label="Arttır">+</button>
      </div>

      <div style={{ minWidth: 90, textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5" }}>{fmt(lineTotal)}</div>
        {item.quantity > 1 && (
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{fmt(item.price)} / adet</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => wrap(onRemove)}
        disabled={pending}
        aria-label="Kaldır"
        style={{
          width: 28, height: 28, flexShrink: 0,
          background: "transparent", color: "#666",
          border: "1px solid #2a2a2a", borderRadius: 5,
          cursor: pending ? "wait" : "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}
