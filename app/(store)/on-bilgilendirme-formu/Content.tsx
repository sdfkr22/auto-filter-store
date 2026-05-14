const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 28, marginBottom: 10 };
const list: React.CSSProperties = { paddingLeft: 22, marginBottom: 10 };
const link: React.CSSProperties = { color: "#FFED00", textDecoration: "none" };

export default function OnBilgilendirmeContent() {
  return (
    <>
      <p>
        İşbu Ön Bilgilendirme Formu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca,
        ALICI ile SATICI arasında düzenlenecek Mesafeli Satış Sözleşmesi'nin akdedilmesinden önce ALICI'ya sunulmuştur.
      </p>

      <h2 style={h2}>1. Satıcı Bilgileri</h2>
      <ul style={list}>
        <li>Unvan: <strong>[Şirket Unvanı — TBD]</strong></li>
        <li>Adres: [Adres — TBD]</li>
        <li>Telefon: [TBD]</li>
        <li>E-posta: [TBD]</li>
        <li>Mersis No: [TBD]</li>
        <li>Vergi Dairesi / No: [TBD]</li>
      </ul>

      <h2 style={h2}>2. Sözleşme Konusu Ürünler ve Bedel</h2>
      <p>
        Sipariş onaylandığı anda görüntülenen ürünlerin temel nitelikleri, satış fiyatı (KDV dahil), kargo ücreti, ödeme şekli ve teslimat süresi ALICI tarafından kabul edilmiştir.
        Fiyatlara KDV dahildir. Kargo ücreti, ücretsiz kargo eşiği geçilmediği sürece ALICI tarafından karşılanır.
      </p>

      <h2 style={h2}>3. Ödeme Şekli</h2>
      <ul style={list}>
        <li>Kredi/Banka Kartı ile (İyzico altyapısı, 3D Secure)</li>
        <li>Havale/EFT</li>
      </ul>

      <h2 style={h2}>4. Teslimat</h2>
      <ul style={list}>
        <li>Teslimat, ALICI tarafından siparişte belirtilen adrese, anlaşmalı kargo firmaları (Yurtiçi / Aras / MNG) aracılığıyla yapılır.</li>
        <li>Teslimat süresi, sipariş onayından itibaren en geç 30 (otuz) gündür. Stoklu ürünler için genellikle 1–3 iş günü içinde kargoya verilir.</li>
        <li>Kargo takip numarası, sipariş kargoya verildikten sonra ALICI'ya bildirilir.</li>
      </ul>

      <h2 style={h2}>5. Cayma Hakkı</h2>
      <p>
        ALICI, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren <strong>14 (on dört) gün</strong> içerisinde
        herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
        Cayma hakkı, ürünün kullanılmamış, hasar görmemiş ve orijinal ambalajının açılmamış olması koşulu ile geçerlidir.
      </p>
      <p>
        Cayma bildirimi <strong>[e-posta — TBD]</strong> adresine yapılır. İade onaylandıktan sonra ALICI ürünü kargoya teslim eder.
        Kargo ücretinin kime ait olacağı <a href="/iade-ve-degisim" style={link}>İade ve Değişim</a> sayfasında belirtilmiştir.
        Cayma hakkının kullanılması durumunda, ürün bedeli en geç 14 gün içinde ALICI'nın hesabına iade edilir.
      </p>

      <h2 style={h2}>6. Cayma Hakkının Kullanılamayacağı Haller</h2>
      <ul style={list}>
        <li>ALICI'nın istekleri veya kişiselleştirilmiş ürünler,</li>
        <li>Tesliminden sonra ambalaj veya koruyucu unsurları açılmış olup iadesi sağlık ve hijyen açısından uygun olmayan ürünler.</li>
      </ul>

      <h2 style={h2}>7. Şikayet ve İtiraz Mercileri</h2>
      <p>
        ALICI; şikayet ve itirazları konusunda, Gümrük ve Ticaret Bakanlığı tarafından belirlenen parasal sınırlar dahilinde
        bulunduğu yerdeki <strong>Tüketici Hakem Heyetlerine</strong> veya <strong>Tüketici Mahkemelerine</strong> başvurabilir.
      </p>
    </>
  );
}
