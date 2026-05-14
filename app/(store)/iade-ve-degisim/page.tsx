import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "İade ve Değişim",
  description: "auto-filter iade ve değişim koşulları — 14 günlük cayma hakkı, iade adımları ve istisnalar.",
};

export default function IadeVeDegisimPage() {
  return (
    <LegalPageShell title="İade ve Değişim" lastUpdated="2026-05-14">
      <p>
        Aldığınız ürünlerden memnun kalmadığınız takdirde, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında
        <strong> teslim tarihinden itibaren 14 gün içinde</strong> herhangi bir gerekçe göstermeksizin iade hakkınız bulunmaktadır.
      </p>

      <h2 style={h2}>İade Şartları</h2>
      <ul style={list}>
        <li>Ürün <strong>kullanılmamış</strong>, orijinal ambalajı <strong>açılmamış</strong> ve hasar görmemiş olmalıdır.</li>
        <li>Fatura ve sipariş bilgileri ürünle birlikte gönderilmelidir.</li>
        <li>Cayma süresi, ürünün ALICI veya belirttiği üçüncü kişiye teslim edildiği günden başlar.</li>
      </ul>

      <h2 style={h2}>İade Adımları</h2>
      <ol style={list}>
        <li><strong>İade talebi oluştur:</strong> <a href="/hesabim" style={link}>Hesabım</a> &rarr; ilgili siparişten &quot;İade Talep Et&quot; butonuna tıklayın (v3'te aktifleşecek). Şimdilik <strong>[e-posta — TBD]</strong> adresine sipariş numaranızla başvurun.</li>
        <li><strong>Onay bekleyin:</strong> Talebiniz 1-2 iş günü içinde değerlendirilir.</li>
        <li><strong>Ürünü kargolayın:</strong> Anlaşmalı kargo şirketimizden ücretsiz iade kodu ile gönderebilirsiniz. Diğer kargo firmalarıyla yapılan gönderimlerin ücreti ALICI'ya aittir.</li>
        <li><strong>Tutar iadesi:</strong> Ürün depomuza ulaştıktan ve incelemesi yapıldıktan sonra ödeme yönteminize göre en geç 14 gün içinde iade gerçekleştirilir.
          <ul style={list}>
            <li>Kredi kartı ile yapılan ödemeler aynı karta,</li>
            <li>Havale/EFT ile yapılan ödemeler ALICI'nın bildireceği banka hesabına iade edilir.</li>
          </ul>
        </li>
      </ol>

      <h2 style={h2}>İade Edilemeyen Ürünler</h2>
      <ul style={list}>
        <li>Tüketicinin isteği veya kişisel ihtiyaçları doğrultusunda hazırlanan veya kişiselleştirilen ürünler,</li>
        <li>Koruyucu ambalajı veya mührü açılmış olup iadesi sağlık/hijyen açısından uygun olmayan ürünler,</li>
        <li>Kullanılmış veya hasar görmüş filtreler.</li>
      </ul>

      <h2 style={h2}>Değişim</h2>
      <p>
        Yanlış ürün gönderimi veya ürün arızası durumlarında, iade süreci yerine doğrudan değişim de talep edebilirsiniz.
        Bu tür durumlarda kargo ücreti tarafımıza aittir. <strong>[e-posta — TBD]</strong> üzerinden bildiriminizi yapınız.
      </p>

      <h2 style={h2}>Hasarlı Ürün Tesliminde</h2>
      <p>
        Kargo paketi hasarlı ise teslim almadan önce kargo görevlisi ile tutanak tutturunuz.
        Tutanağı ve hasar fotoğraflarını <strong>[e-posta — TBD]</strong> adresine ileterek bize bildiriniz.
        Bu durumlarda ürün ücretsiz olarak yenisi ile değiştirilir veya bedeli iade edilir.
      </p>

      <h2 style={h2}>İletişim</h2>
      <p>
        İade ve değişim ile ilgili her türlü sorunuz için <a href="/iletisim" style={link}>iletişim sayfamızdan</a> bize ulaşabilirsiniz.
      </p>
    </LegalPageShell>
  );
}

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 28, marginBottom: 10 };
const list: React.CSSProperties = { paddingLeft: 22, marginBottom: 10 };
const link: React.CSSProperties = { color: "#FFED00", textDecoration: "none" };
