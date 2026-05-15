"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { updateProduct } from "@/lib/admin/product-actions";

type Product = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  product_type: string;
  label: string | null;
  image_url: string | null;
  price: number | null;
  compare_price: number | null;
  stock: number;
  active: boolean;
};

export default function ProductRow({ product }: { product: Product }) {
  const [price, setPrice] = useState(product.price?.toString() ?? "0");
  const [stock, setStock] = useState(product.stock.toString());
  const [active, setActive] = useState(product.active);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();

  const initial = {
    price: product.price?.toString() ?? "0",
    stock: product.stock.toString(),
  };

  function save(patch: Parameters<typeof updateProduct>[1]) {
    setStatus("saving");
    startTransition(async () => {
      const res = await updateProduct(product.id, patch);
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 1500);
    });
  }

  function commitPrice() {
    const num = parseFloat(price);
    if (isNaN(num) || num < 0) {
      setPrice(initial.price);
      return;
    }
    if (num.toString() === initial.price) return;
    save({ price: num });
  }

  function commitStock() {
    const num = parseInt(stock, 10);
    if (isNaN(num) || num < 0) {
      setStock(initial.stock);
      return;
    }
    if (num.toString() === initial.stock) return;
    save({ stock: num });
  }

  function toggleActive() {
    const next = !active;
    setActive(next);
    save({ active: next });
  }

  const borderColor =
    status === "saving" ? "#5a4a1a" :
    status === "saved" ? "#2a5a2a" :
    status === "error" ? "#5a2a2a" :
    "#222";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 110px 120px 100px 90px 60px",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid #1a1a1a",
        alignItems: "center",
        background: status === "saved" ? "#0e1a0e" : status === "error" ? "#1a0e0e" : "transparent",
        transition: "background 0.3s",
      }}
    >
      <div style={{ width: 48, height: 48, position: "relative", background: "#0a0a0a", borderRadius: 4, overflow: "hidden" }}>
        {product.image_url ? (
          <Image src={product.image_url} alt="" fill style={{ objectFit: "contain" }} sizes="48px" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 10 }}>
            Yok
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: "#fff" }}>
          {product.product_name}
        </div>
        {product.product_fancy_name && (
          <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.product_fancy_name}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
          <span style={{ textTransform: "uppercase" }}>{product.product_type}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#aaa" }}>{product.label ?? "—"}</div>

      <input
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={commitPrice}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") { setPrice(initial.price); (e.target as HTMLInputElement).blur(); }
        }}
        style={{
          ...cellInputStyle,
          borderColor,
        }}
      />

      <input
        type="number"
        min="0"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        onBlur={commitStock}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") { setStock(initial.stock); (e.target as HTMLInputElement).blur(); }
        }}
        style={{
          ...cellInputStyle,
          borderColor,
        }}
      />

      <button
        type="button"
        onClick={toggleActive}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          background: active ? "#1a3a1a" : "#3a1a1a",
          border: `1px solid ${active ? "#2a5a2a" : "#5a2a2a"}`,
          color: active ? "#7ad17a" : "#d17a7a",
          borderRadius: 4,
          cursor: "pointer",
          width: 70,
        }}
      >
        {active ? "Aktif" : "Pasif"}
      </button>

      <Link
        href={`/admin/urunler/${product.id}`}
        style={{ color: "#8fa4c0", fontSize: 12, textDecoration: "none", textAlign: "center" }}
      >
        Düzenle
      </Link>
    </div>
  );
}

const cellInputStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "#0a0a0a",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#222",
  borderRadius: 4,
  color: "#e5e5e5",
  fontSize: 13,
  width: "100%",
  fontFamily: "monospace",
};
