import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductRow from "./ProductRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  q?: string;
  label?: string;
  filter?: "no-price" | "no-stock" | "inactive";
  page?: string;
}>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const label = sp.label ?? "";
  const filter = sp.filter ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const sb = createAdminClient();

  let query = sb
    .from("products")
    .select(
      "id, product_name, product_fancy_name, product_type, label, image_url, price, compare_price, stock, active",
      { count: "exact" }
    );

  if (q) {
    const esc = q.replace(/[%,()]/g, "");
    query = query.or(`product_name.ilike.%${esc}%,product_fancy_name.ilike.%${esc}%`);
  }
  if (label) query = query.eq("label", label);
  if (filter === "no-price") query = query.or("price.is.null,price.eq.0");
  else if (filter === "no-stock") query = query.eq("stock", 0);
  else if (filter === "inactive") query = query.eq("active", false);

  const { data: products, count } = await query.order("product_name").range(start, end);

  const { data: categories } = await sb
    .from("categories")
    .select("slug, name_tr")
    .order("sort_order");

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>Ürünler</h1>
        <span style={{ color: "#888", fontSize: 13 }}>
          {total.toLocaleString("tr-TR")} ürün — sayfa {page}/{totalPages}
        </span>
      </div>

      <form
        method="get"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
          background: "#141414",
          padding: 16,
          border: "1px solid #222",
          borderRadius: 8,
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Kod veya isim ara…"
          style={inputStyle}
        />
        <select name="label" defaultValue={label} style={inputStyle}>
          <option value="">Tüm kategoriler</option>
          {(categories ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name_tr}
            </option>
          ))}
        </select>
        <select name="filter" defaultValue={filter} style={inputStyle}>
          <option value="">Tüm ürünler</option>
          <option value="no-price">Fiyatsız</option>
          <option value="no-stock">Stoksuz</option>
          <option value="inactive">Pasif</option>
        </select>
        <button type="submit" style={btnPrimaryStyle}>Filtrele</button>
        {(q || label || filter) && (
          <Link href="/admin/urunler" style={btnGhostStyle}>Temizle</Link>
        )}
      </form>

      <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr 110px 120px 100px 90px 60px",
            gap: 12,
            padding: "12px 16px",
            background: "#0e0e0e",
            borderBottom: "1px solid #222",
            fontSize: 12,
            color: "#888",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          <div>Görsel</div>
          <div>Kod / İsim</div>
          <div>Kategori</div>
          <div>Fiyat (₺)</div>
          <div>Stok</div>
          <div>Aktif</div>
          <div></div>
        </div>

        {(products ?? []).length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#666" }}>
            Eşleşen ürün yok.
          </div>
        ) : (
          (products ?? []).map((p) => <ProductRow key={p.id} product={p} />)
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
          {page > 1 && (
            <PageLink params={sp} page={page - 1}>← Önceki</PageLink>
          )}
          <span style={{ padding: "8px 12px", color: "#888", fontSize: 13 }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <PageLink params={sp} page={page + 1}>Sonraki →</PageLink>
          )}
        </div>
      )}
    </div>
  );
}

function PageLink({
  params,
  page,
  children,
}: {
  params: { q?: string; label?: string; filter?: string };
  page: number;
  children: React.ReactNode;
}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.label) usp.set("label", params.label);
  if (params.filter) usp.set("filter", params.filter);
  usp.set("page", String(page));
  return (
    <Link href={`/admin/urunler?${usp.toString()}`} style={btnGhostStyle}>
      {children}
    </Link>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "#0a0a0a",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  color: "#e5e5e5",
  fontSize: 14,
  minWidth: 140,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#2a4a7a",
  border: "1px solid #3a5a8a",
  borderRadius: 6,
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};

const btnGhostStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  color: "#cfcfcf",
  fontSize: 14,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};
