"use client";

import { useState, useTransition } from "react";
import { updateProduct, type ProductPatch } from "@/lib/admin/product-actions";

type Product = {
  id: string;
  product_name: string;
  product_type: string;
  label: string | null;
  image_url: string | null;
  price: number | null;
  compare_price: number | null;
  stock: number;
  reserved_stock: number;
  active: boolean;
  featured: boolean;
  description_tr: string | null;
  description_en: string | null;
  meta_title_tr: string | null;
  meta_desc_tr: string | null;
  meta_title_en: string | null;
  meta_desc_en: string | null;
};

export default function ProductEditForm({ product }: { product: Product }) {
  const [form, setForm] = useState({
    price: product.price?.toString() ?? "0",
    compare_price: product.compare_price?.toString() ?? "",
    stock: product.stock.toString(),
    label: product.label ?? "",
    image_url: product.image_url ?? "",
    active: product.active,
    featured: product.featured,
    description_tr: product.description_tr ?? "",
    description_en: product.description_en ?? "",
    meta_title_tr: product.meta_title_tr ?? "",
    meta_desc_tr: product.meta_desc_tr ?? "",
    meta_title_en: product.meta_title_en ?? "",
    meta_desc_en: product.meta_desc_en ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [, startTransition] = useTransition();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrMsg("");

    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    const comparePrice = form.compare_price ? parseFloat(form.compare_price) : null;

    if (isNaN(price) || price < 0) { setStatus("error"); setErrMsg("Geçersiz fiyat"); return; }
    if (isNaN(stock) || stock < 0) { setStatus("error"); setErrMsg("Geçersiz stok"); return; }
    if (comparePrice != null && (isNaN(comparePrice) || comparePrice < 0)) {
      setStatus("error"); setErrMsg("Geçersiz karşılaştırma fiyatı"); return;
    }

    const patch: ProductPatch = {
      price,
      compare_price: comparePrice,
      stock,
      label: form.label || null,
      image_url: form.image_url || null,
      active: form.active,
      featured: form.featured,
      description_tr: form.description_tr || null,
      description_en: form.description_en || null,
      meta_title_tr: form.meta_title_tr || null,
      meta_desc_tr: form.meta_desc_tr || null,
      meta_title_en: form.meta_title_en || null,
      meta_desc_en: form.meta_desc_en || null,
    };

    startTransition(async () => {
      const res = await updateProduct(product.id, patch);
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setErrMsg(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Section title="Ticari">
        <Row>
          <Field label="Fiyat (₺)">
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Karşılaştırma Fiyatı (üstü çizili)">
            <input type="number" step="0.01" min="0" value={form.compare_price} onChange={(e) => set("compare_price", e.target.value)} style={inputStyle} placeholder="opsiyonel" />
          </Field>
        </Row>
        <Row>
          <Field label="Stok">
            <input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Rezerve Stok (sepetteki)">
            <input type="number" value={product.reserved_stock} disabled style={{ ...inputStyle, opacity: 0.5 }} />
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 24 }}>
          <Toggle label="Aktif" value={form.active} onChange={(v) => set("active", v)} />
          <Toggle label="Öne Çıkan" value={form.featured} onChange={(v) => set("featured", v)} />
        </div>
      </Section>

      <Section title="Genel">
        <Field label="Kategori (label)">
          <input value={form.label} onChange={(e) => set("label", e.target.value)} style={inputStyle} placeholder="örn. yag-filtresi" />
        </Field>
        <Field label="Görsel URL">
          <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} style={inputStyle} placeholder="https://…" />
        </Field>
      </Section>

      <Section title="Açıklamalar">
        <Field label="Açıklama (TR)">
          <textarea value={form.description_tr} onChange={(e) => set("description_tr", e.target.value)} style={textareaStyle} rows={4} />
        </Field>
        <Field label="Açıklama (EN)">
          <textarea value={form.description_en} onChange={(e) => set("description_en", e.target.value)} style={textareaStyle} rows={4} />
        </Field>
      </Section>

      <Section title="SEO">
        <Field label="Meta Title (TR)">
          <input value={form.meta_title_tr} onChange={(e) => set("meta_title_tr", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Meta Description (TR)">
          <textarea value={form.meta_desc_tr} onChange={(e) => set("meta_desc_tr", e.target.value)} style={textareaStyle} rows={2} />
        </Field>
        <Field label="Meta Title (EN)">
          <input value={form.meta_title_en} onChange={(e) => set("meta_title_en", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Meta Description (EN)">
          <textarea value={form.meta_desc_en} onChange={(e) => set("meta_desc_en", e.target.value)} style={textareaStyle} rows={2} />
        </Field>
      </Section>

      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 16, borderTop: "1px solid #222" }}>
        <button type="submit" disabled={status === "saving"} style={btnPrimaryStyle}>
          {status === "saving" ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {status === "saved" && <span style={{ color: "#7ad17a", fontSize: 13 }}>✓ Kaydedildi</span>}
        {status === "error" && <span style={{ color: "#d17a7a", fontSize: 13 }}>✕ Hata: {errMsg}</span>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ background: "#141414", border: "1px solid #222", borderRadius: 8, padding: 20 }}>
      <legend style={{ padding: "0 8px", color: "#888", fontSize: 13, fontWeight: 600 }}>{title}</legend>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </fieldset>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#aaa" }}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ fontSize: 14 }}>{label}</span>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "#0a0a0a",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  color: "#e5e5e5",
  fontSize: 14,
  width: "100%",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "inherit",
  resize: "vertical",
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#2a4a7a",
  border: "1px solid #3a5a8a",
  borderRadius: 6,
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
