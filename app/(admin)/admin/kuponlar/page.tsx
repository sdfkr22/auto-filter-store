import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Kuponlar" };

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};

export default async function AdminCouponsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_until, active")
    .order("active", { ascending: false })
    .order("code");

  const list = coupons ?? [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Kuponlar</h1>
        <Link
          href="/admin/kuponlar/yeni"
          style={{
            background: "#FFED00", color: "#0a0a0a",
            padding: "8px 16px", borderRadius: 6,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}
        >
          + Yeni kupon
        </Link>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: 40, background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, textAlign: "center", color: "#666" }}>
          Henüz kupon yok.
        </div>
      ) : (
        <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111", color: "#888", textAlign: "left" }}>
                <Th>Kod</Th>
                <Th>İndirim</Th>
                <Th>Min. Sipariş</Th>
                <Th>Kullanım</Th>
                <Th>Geçerlilik</Th>
                <Th>Durum</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #1a1a1a" }}>
                  <Td>
                    <span style={{ fontFamily: "monospace", color: "#e5e5e5", fontWeight: 700 }}>{c.code}</span>
                  </Td>
                  <Td>
                    {c.type === "percent" ? `%${c.value}` : `₺${Number(c.value).toLocaleString("tr-TR")}`}
                  </Td>
                  <Td>{c.min_order_amount > 0 ? `₺${Number(c.min_order_amount).toLocaleString("tr-TR")}` : "—"}</Td>
                  <Td>
                    {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""}
                  </Td>
                  <Td style={{ color: "#888", fontSize: 12 }}>
                    {fmtDate(c.valid_from)} → {fmtDate(c.valid_until)}
                  </Td>
                  <Td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                      background: c.active ? "#0a2010" : "#1e1010",
                      color: c.active ? "#52c07a" : "#905050",
                    }}>
                      {c.active ? "Aktif" : "Pasif"}
                    </span>
                  </Td>
                  <Td>
                    <Link href={`/admin/kuponlar/${c.id}`} style={{ color: "#FFED00", fontSize: 12, textDecoration: "none" }}>
                      Düzenle →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</th>;
}
function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 14px", verticalAlign: "middle", ...style }}>{children}</td>;
}
