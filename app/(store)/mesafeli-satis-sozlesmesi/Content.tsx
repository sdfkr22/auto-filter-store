// Hem standalone sayfa hem de checkout modal'ında kullanılır.
// "use client" yok — saf JSX, her iki ortamda da render edilebilir.

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 28, marginBottom: 10 };
const h3: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#e5e5e5", marginTop: 18, marginBottom: 6 };
const list: React.CSSProperties = { paddingLeft: 22, marginBottom: 10 };

export default function MesafeliSatisContent() {
  return (
    <>
      <h2 style={h2}>1. Taraflar</h2>
      <p>
        İşbu Mesafeli Satış Sözleşmesi (&quot;Sözleşme&quot;), aşağıda bilgileri yer alan SATICI ile,
        siparişi onaylayan ALICI arasında, aşağıda belirtilen hüküm ve şartlar dahilinde elektronik ortamda kurulmuştur.
      </p>

      <h3 style={h3}>SATICI</h3>
      <ul style={list}>
        <li>Unvan: <strong>[Şirket Unvanı — TBD]</strong></li>
        <li>Adres: [Adres — TBD]</li>
        <li>Vergi Dairesi / No: [TBD]</li>
        <li>Mersis No: [TBD]</li>
        <li>Telefon: [TBD]</li>
        <li>E-posta: [TBD]</li>
        <li>Web: auto-filter.com</li>
      </ul>

      <h3 style={h3}>ALICI</h3>
      <p>Siparişi onaylayan ve siparişte belirtilen kişi/kuruluş.</p>

      <h2 style={h2}>2. Sözleşme Konusu</h2>
      <p>
        İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait <strong>auto-filter.com</strong> internet sitesi üzerinden elektronik ortamda
        sipariş verdiği, Sözleşme'de nitelikleri ve satış fiyatı belirtilen ürün/ürünlerin satışı ve teslimi ile ilgili olarak
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
      </p>

      <h2 style={h2}>3. Sözleşme Konusu Ürün</h2>
      <p>
        Ürünlerin türü, miktarı, marka/modeli, satış bedeli, ödeme şekli, teslim alacak kişi, teslimat adresi, fatura bilgileri ve
        kargo ücreti siparişin onaylandığı anda ALICI tarafından görülmüş ve onaylanmıştır. Faturada belirtilen bilgiler esas alınır.
      </p>

      <h2 style={h2}>4. Genel Hükümler</h2>
      <ul style={list}>
        <li>ALICI, Sözleşme konusu ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat ile ilgili tüm ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda onay verdiğini beyan eder.</li>
        <li>Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşulu ile ALICI'nın teslimat adresine kargo firması aracılığıyla SATICI tarafından teslim edilir.</li>
        <li>Kargo ücreti, aksi belirtilmediği sürece ALICI tarafından karşılanır. Ücretsiz kargo eşiği sipariş sırasında gösterilir.</li>
        <li>Ürünün tesliminden sonra ALICI'ya ait kredi kartının ALICI'nın kusurundan kaynaklanmayan bir sebeple yetkisiz kişilerce haksız veya hukuka aykırı olarak kullanılması nedeni ile ilgili banka veya finans kuruluşunun ürün bedelini SATICI'ya ödememesi halinde, ALICI ürünü 3 gün içerisinde SATICI'ya iade etmekle yükümlüdür.</li>
        <li>SATICI mücbir sebepler veya nakliyeyi engelleyen hava muhalefetleri, ulaşımın kesilmesi gibi olağanüstü durumlar nedeni ile Sözleşme konusu ürünü süresi içinde teslim edemez ise, durumu ALICI'ya bildirir. Bu takdirde ALICI siparişin iptal edilmesini, ürünün benzeri ile değiştirilmesini veya engel ortadan kalkana kadar teslimatın ertelenmesini talep edebilir.</li>
      </ul>

      <h2 style={h2}>5. Cayma Hakkı</h2>
      <p>
        ALICI; Sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren <strong>14 (on dört) gün</strong> içinde
        hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkını kullanabilir.
      </p>
      <p>
        Cayma hakkının kullanılması için bu süre içinde SATICI'ya yazılı olarak veya elektronik posta (<strong>[e-posta — TBD]</strong>) ile bildirimde bulunulması zorunludur.
        Bu hakkın kullanılması halinde, ALICI'ya teslim edilen ürünün eksiksiz ve hasarsız olarak SATICI'ya geri gönderilmesi şarttır.
        Cayma hakkının kullanılmasını takip eden 14 gün içinde ürün bedeli ALICI'ya iade edilir.
      </p>

      <h2 style={h2}>6. Cayma Hakkının Kullanılamayacağı Ürünler</h2>
      <ul style={list}>
        <li>Tüketici'nin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler,</li>
        <li>Niteliği itibariyle iade edilemeyecek, hızla bozulan veya son kullanma tarihi geçen ürünler,</li>
        <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan ürünlerden iadesi sağlık ve hijyen açısından uygun olmayanlar.</li>
      </ul>

      <h2 style={h2}>7. Yetkili Mahkeme</h2>
      <p>
        İşbu Sözleşme'nin uygulanmasından doğacak uyuşmazlıklarda, Gümrük ve Ticaret Bakanlığı'nca ilan edilen değere kadar
        Tüketici Hakem Heyetleri ile ALICI'nın veya SATICI'nın yerleşim yerindeki <strong>Tüketici Mahkemeleri</strong> yetkilidir.
      </p>

      <h2 style={h2}>8. Yürürlük</h2>
      <p>
        ALICI, sipariş onayı vererek bu Sözleşme'nin tüm koşullarını kabul etmiş sayılır. Sözleşme, ALICI'nın siparişi onayladığı tarihte yürürlüğe girer.
      </p>
    </>
  );
}
