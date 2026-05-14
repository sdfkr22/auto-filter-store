import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kargo Bilgisi",
  description: "auto-filter kargo seçenekleri, ücretleri, ücretsiz kargo eşiği ve tahmini teslimat süreleri.",
};

const fmt = (n: number) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function KargoBilgisiPage() {
  const sb = await createClient();
  const { data: methods } = await sb
    .from("shipping_methods")
    .select("name, company, price, free_above, estimated_days")
    .eq("active", true)
    .order("price");

  return (
    <LegalPageShell title="Kargo Bilgisi" lastUpdated="2026-05-14">
      <p>
        Siparişleriniz anlaşmalı kargo firmalarımız aracılığıyla Türkiye'nin her noktasına gönderilmektedir.
        Stoklu ürünler genellikle <strong>1–3 iş günü</strong> içinde kargoya verilir.
      </p>

      <h2 style={h2}>Kargo Seçenekleri</h2>
      {(methods ?? []).length === 0 ? (
        <p style={{ color: "#888" }}>Şu anda aktif kargo seçeneği bulunmuyor.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {(methods ?? []).map((m, idx) => (
            <div key={idx} style={methodCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{m.company}</div>
                <div style={{ fontWeight: 700, color: "#FFED00", fontSize: 15 }}>{fmt(m.price)}</div>
              </div>
              <div style={{ fontSize: 13, color: "#aaa" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                {m.estimated_days ? `Tahmini süre: ${m.estimated_days}` : ""}
                {m.free_above != null && (
                  <span>
                    {m.estimated_days ? " · " : ""}
                    {fmt(m.free_above)} ve üzeri siparişlerde <strong style={{ color: "#7ad19a" }}>ücretsiz</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={h2}>Teslimat Süreleri</h2>
      <ul style={list}>
        <li><strong>Stoklu ürünler:</strong> 1–3 iş günü içinde kargoya verilir.</li>
        <li><strong>Tedarik gerektiren ürünler:</strong> Ürün detay sayfasında belirtilen süre dahilinde gönderilir.</li>
        <li><strong>Hafta sonu ve resmi tatil günleri:</strong> Bu günlerde gelen siparişler bir sonraki iş günü işleme alınır.</li>
      </ul>

      <h2 style={h2}>Kargo Takibi</h2>
      <p>
        Siparişiniz kargoya verildiğinde, e-posta ile takip numaranız tarafınıza iletilir.
        Ayrıca <a href="/hesabim" style={link}>Hesabım</a> sayfasından siparişlerinizin durumunu takip edebilirsiniz.
      </p>

      <h2 style={h2}>Teslimat Sırasında</h2>
      <ul style={list}>
        <li>Paketin dış görünüşünü kontrol ediniz. Hasarlı paketleri kabul etmeyiniz ya da kargo görevlisi ile tutanak tutturunuz.</li>
        <li>Eksik veya hasarlı ürün durumunda 24 saat içinde bize ulaşınız.</li>
        <li>Teslimat adresinde alıcı bulunmadığı takdirde kargo firması, ikinci teslimat denemesi yapacaktır.</li>
      </ul>

      <h2 style={h2}>İade Kargo Ücreti</h2>
      <p>
        Cayma hakkı kullanıldığında, ürünün anlaşmalı iade kargosu ile gönderilmesi durumunda <strong>kargo ücreti tarafımıza aittir</strong>.
        Diğer kargo firmaları ile yapılan iade gönderilerinde kargo ücreti ALICI'ya aittir.
        Yanlış ürün gönderimi veya ürün arızası kaynaklı iadelerde kargo ücreti her durumda tarafımıza aittir.
      </p>
    </LegalPageShell>
  );
}

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 28, marginBottom: 10 };
const list: React.CSSProperties = { paddingLeft: 22, marginBottom: 10 };
const link: React.CSSProperties = { color: "#FFED00", textDecoration: "none" };
const methodCard: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 16,
};
