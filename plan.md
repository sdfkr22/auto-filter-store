# E-Ticaret Dönüşüm Planı — auto-filter

**v1** = Mevcut uygulama (sadece filtre sorgulama aracı)
**v2 → v5** = Aşamalı e-ticaret platformu

---

## Teknoloji Kararları (tüm versiyonlar için geçerli)

| Katman | Seçim |
|---|---|
| Frontend / Backend | **Next.js 14** App Router |
| Veritabanı | **Supabase** (PostgreSQL + Auth + Storage) |
| Ödeme | **İyzico** (kredi kartı + taksit) + Havale/EFT |
| Kargo | Yurtiçi / Aras / MNG (adaptör katmanı) |
| E-Fatura | **Paraşüt API** (GIB e-Arşiv) |
| E-posta | **Resend** |
| SMS | **Netgsm** |
| Çoklu Dil | **next-intl** (TR + EN) |
| Analytics | GTM → GA4 + Meta Pixel |
| Heatmap | Microsoft Clarity |
| Canlı Destek | Tawk.to + WhatsApp butonu |
| Hata Takip | Sentry |
| Stil | Mevcut inline stil sistemi korunur |

---

## Veritabanı Şeması (tam — tüm versiyonlar)

```sql
categories (
  id uuid PK,
  slug text UNIQUE,
  name_tr text, name_en text,
  icon text, color text, sort_order int
)

products (
  id uuid PK,
  mann_code text UNIQUE, mann_name text, filtron_code text,
  category_id uuid references categories,
  label_tr text, label_en text,
  mann_url text, filtron_url text,
  images text[],                    -- ek görseller (Supabase Storage)
  price numeric DEFAULT 0,          -- TRY, admin girer
  price_en numeric,                 -- EUR (v5)
  compare_price numeric,            -- üstü çizili eski fiyat
  stock int DEFAULT 0,
  reserved_stock int DEFAULT 0,     -- sepetteki rezerve stok
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  meta_title_tr text, meta_desc_tr text,
  meta_title_en text, meta_desc_en text,
  created_at timestamptz, updated_at timestamptz
)

profiles (
  id uuid PK references auth.users,
  full_name text, phone text,
  tc_no text, tax_no text, tax_office text,
  is_corporate boolean DEFAULT false,
  role text DEFAULT 'customer',     -- 'customer' | 'admin'
  newsletter boolean DEFAULT false,
  created_at timestamptz
)

addresses (
  id uuid PK,
  user_id uuid references profiles,
  title text, full_name text, phone text,
  full_address text, city text, district text, zip text,
  is_default boolean DEFAULT false,
  is_billing boolean DEFAULT false
)

wishlists (
  id uuid PK,
  user_id uuid references profiles,
  product_id uuid references products,
  created_at timestamptz,
  UNIQUE(user_id, product_id)
)

reviews (
  id uuid PK,
  product_id uuid references products,
  user_id uuid references profiles,
  rating int CHECK (rating BETWEEN 1 AND 5),
  title text, body text,
  approved boolean DEFAULT false,
  created_at timestamptz
)

coupons (
  id uuid PK,
  code text UNIQUE,
  type text,            -- 'percent' | 'fixed'
  value numeric,
  min_order_amount numeric DEFAULT 0,
  max_uses int,
  used_count int DEFAULT 0,
  valid_from timestamptz, valid_until timestamptz,
  active boolean DEFAULT true
)

shipping_methods (
  id uuid PK,
  name text, company text,
  price numeric, free_above numeric,
  estimated_days text,
  active boolean DEFAULT true
)

cart_items (
  id uuid PK,
  user_id uuid references profiles,
  product_id uuid references products,
  quantity int DEFAULT 1,
  created_at timestamptz, updated_at timestamptz
)

orders (
  id uuid PK,
  order_no text UNIQUE,             -- "AF-2026-00042"
  user_id uuid references profiles,
  status text DEFAULT 'pending',
  -- pending | awaiting_payment | paid | preparing | shipped | delivered | cancelled | refunded
  subtotal numeric, shipping_cost numeric,
  discount_amount numeric DEFAULT 0, total numeric,
  currency text DEFAULT 'TRY', locale text DEFAULT 'tr',
  coupon_id uuid references coupons,
  shipping_method_id uuid references shipping_methods,
  shipping_address_id uuid references addresses,
  billing_address_id uuid references addresses,
  payment_method text,              -- 'credit_card' | 'bank_transfer'
  iyzico_payment_id text,
  bank_transfer_ref text,
  cargo_company text, cargo_tracking_no text,
  einvoice_id text, einvoice_pdf_url text,
  notes text,
  created_at timestamptz, updated_at timestamptz
)

order_items (
  id uuid PK,
  order_id uuid references orders,
  product_id uuid references products,
  mann_code text,                   -- snapshot
  product_name text,                -- snapshot
  quantity int, unit_price numeric, total_price numeric
)

returns (
  id uuid PK,
  order_id uuid references orders,
  user_id uuid references profiles,
  status text DEFAULT 'requested',  -- requested | approved | rejected | refunded
  reason text, description text,
  refund_amount numeric, iyzico_refund_id text,
  created_at timestamptz, resolved_at timestamptz
)

banners (
  id uuid PK,
  title text, subtitle text, image_url text, link text,
  sort_order int, active boolean DEFAULT true,
  valid_from timestamptz, valid_until timestamptz
)

newsletter_subscribers (
  id uuid PK,
  email text UNIQUE, locale text DEFAULT 'tr',
  subscribed boolean DEFAULT true,
  confirmed boolean DEFAULT false,  -- double opt-in
  created_at timestamptz
)

admin_logs (
  id uuid PK,
  admin_id uuid references profiles,
  action text, target_table text, target_id uuid,
  old_value jsonb, new_value jsonb,
  created_at timestamptz
)
```

---

---

# V2 — Çalışan E-Ticaret (MVP)

> **Hedef:** Ürün satabilir, ödeme alabilir, siparişi yönetebilir hale gelmek.
> **Süre:** ~5–6 hafta

---

## V2.1 — Altyapı ✅ TAMAMLANDI

- [x] `create-next-app` (TypeScript) → `D:\docs_p\myprojects\auto-filter-store`
- [x] Supabase projesi kuruldu → `tdqeaxhufcnafvyqgjgb.supabase.co` (Frankfurt)
- [x] DB şeması oluşturuldu (14 tablo + RLS + triggerlar) → `scripts/schema.sql`
- [x] 4 kategori seed: Yağ / Hava / Polen / Yakıt filtresi
- [x] 3 kargo yöntemi seed: Yurtiçi / Aras / MNG
- [x] 2565 ürün migrate edildi → `scripts/migrate-products.ts`
- [x] `mann-filter-data.json` + `products.json` proje kök dizininde
- [x] Supabase client utils: `lib/supabase/client.ts`, `server.ts`, `admin.ts`
- [x] TypeScript tipleri üretildi → `lib/supabase/types.ts` (883 satır)
- [x] `.env.local` — Supabase credentials dolu, İyzico sandbox hazır
- [x] `app/layout.tsx` — Türkçe meta, dark tema body stili
- [ ] Supabase Storage: `products` bucket (henüz oluşturulmadı)
- [ ] Vercel'e bağla, preview deploy

> **Proje dizini:** `D:\docs_p\myprojects\auto-filter-store`
> **Mimari not:** `mann-filter-data.json` (380k satır araç verisi) DB'ye taşınmadı — statik JSON olarak kalır. Araç→filtre eşleşmesi JSON'dan, ticari veri (fiyat/stok) Supabase'den çekilir.

## V2.2 — Kullanıcı Girişi ✅ TAMAMLANDI

- [x] `/giris` — e-posta + şifre + Google OAuth
- [x] `/kayit` — ad, e-posta, telefon, şifre
- [x] `/sifremi-unuttum` + `/sifremi-sifirla`
- [x] E-posta doğrulama (Supabase SMTP — callback route hazır)
- [x] `proxy.ts` (Next.js 16) — korumalı sayfalar: `/hesabim`, `/sepet`, `/odeme`, `/admin`
- [x] `/hesabim` — dashboard (sipariş / adres / profil / fatura linkleri) + çıkış
- [x] `/hesabim/fatura-bilgileri` — TC/vergi no, kurumsal toggle

## V2.3 — Ürün Kataloğu

- [ ] **Ana Sayfa** (`/`): araç filtresi widget (mevcut korunur) + filtre kartlarına fiyat + "Sepete Ekle" eklenir
- [ ] **Ürün Listeleme** (`/urunler`): kategori bazlı liste, fiyat, stok durumu, "Sepete Ekle" butonu
- [ ] **Ürün Detay** (`/urun/[mann_code]`):
  - Görsel, MANN kodu, Filtron muadili, fiyat, stok
  - Adet seçici + "Sepete Ekle"
  - Uyumlu araçlar (mevcut modal mantığı, accordion'a dönüştür)
  - Breadcrumb
- [ ] Stok = 0 → "Tükendi" badge, buton pasif
- [ ] `compare_price` varsa üstü çizili eski fiyat + indirim % rozeti

## V2.4 — Sepet

- [ ] Giriş yapmış: `cart_items` tablosu
- [ ] Misafir: `localStorage` → girişte DB ile merge
- [ ] `/sepet` — ürün listesi, adet ±, kaldır, ara toplam
- [ ] Header: sepet ikonu + adet rozeti
- [ ] Stok rezervasyonu: sepete eklenince `reserved_stock` +1, 30 dk cron expire

## V2.5 — Ödeme

- [ ] `/odeme` — 3 adım: teslimat adresi → kargo yöntemi → ödeme
- [ ] Kargo: `shipping_methods` tablosundan, ücretsiz kargo eşiği gösterimi
- [ ] **Kredi/Banka Kartı**: İyzico iframe + 3D Secure
- [ ] **Havale/EFT**: banka bilgileri gösterilir, referans no girilir → `awaiting_payment`
- [ ] Taksit seçenekleri: İyzico installment API
- [ ] Zorunlu onaylar:
  - [ ] Mesafeli Satış Sözleşmesi checkbox ✓ (Türk hukuku — zorunlu)
  - [ ] Ön Bilgilendirme Formu checkbox ✓ (Türk hukuku — zorunlu)
- [ ] Başarılı ödeme: `orders` + `order_items` yaz, stok düş
- [ ] `/odeme/basarili/[orderId]` + `/odeme/hata`
- [ ] Sipariş onay e-postası → müşteriye (Resend)

## V2.6 — Admin Paneli (Temel)

- [ ] `/admin` — sadece `role = 'admin'` (middleware + RLS)
- [ ] **Dashboard**: bekleyen siparişler, havale bekleyenler, düşük stok uyarısı
- [ ] **Ürün Yönetimi** (`/admin/urunler`): fiyat ve stok gir, aktif/pasif toggle
- [ ] **Sipariş Yönetimi** (`/admin/siparisler`):
  - Durum filtreleme
  - Durum güncelle (pending → paid → shipped → delivered)
  - Havale onayı: referans no eşleştir → `paid`
  - Kargo takip numarası gir
- [ ] Kargo takip no girilince müşteriye e-posta bildirimi

## V2.7 — Temel Yasal Sayfalar

- [ ] `/mesafeli-satis-sozlesmesi` — zorunlu, Türk Tüketici Kanunu
- [ ] `/on-bilgilendirme-formu` — zorunlu
- [ ] `/iade-ve-degisim` — 14 günlük iade hakkı
- [ ] `/kargo-bilgisi` — kargo ücretleri ve tahmini süreler
- [ ] `/iletisim` — adres, telefon, e-posta, basit iletişim formu

## V2.8 — Yayına Alma

- [ ] İyzico sandbox → production
- [ ] Admin panelden ürünlere fiyat + stok girişi
- [ ] Uçtan uca test: kayıt → ürün bul → sepet → ödeme → sipariş
- [ ] Mobil test

---

---

# V3 — Daha İyi Alışveriş Deneyimi

> **Hedef:** Müşteri alışveriş deneyimini zenginleştir, pazarlama araçlarını ekle.
> **Süre:** ~3–4 hafta

---

## V3.1 — Ürün Arama

- [ ] Header'da arama çubuğu (her sayfada)
- [ ] Canlı öneri: MANN kodu, Filtron kodu, araç adı ile (Supabase full-text)
- [ ] `/arama?q=W712` — arama sonuçları sayfası
- [ ] Sonuç yoksa: benzer ürün önerileri

## V3.2 — Gelişmiş Katalog

- [ ] `/urunler` — sol sidebar: kategori + marka (MANN/Filtron) + fiyat aralığı filtresi
- [ ] Sıralama: en yeni, fiyat artan/azalan, en çok satılan
- [ ] Sayfalama (Supabase range)
- [ ] Ana sayfa: kampanya bannerları (admin yönetimli), öne çıkan ürünler

## V3.3 — Favoriler

- [ ] Kalp ikonu — ürün kartlarında + detay sayfasında
- [ ] Giriş yoksa → login'e yönlendir
- [ ] Header'da favori adedi rozeti
- [ ] `/hesabim/favoriler` sayfası

## V3.4 — Kupon / İndirim Kodları

- [ ] Sepet sayfasında kupon kodu alanı
- [ ] `POST /api/coupon/validate` — doğrulama + indirim tutarı
- [ ] % veya sabit TL indirim
- [ ] Min sipariş tutarı + kullanım limiti + tarih kontrolü
- [ ] `/admin/kuponlar` — kupon oluştur, düzenle, aktif/pasif

## V3.5 — İade Sistemi

- [ ] Müşteri: sipariş detayından "İade Talep Et" (14 gün, teslim sonrası)
- [ ] İade sebebi seç + açıklama
- [ ] `/admin/iadeler` — talepleri gör, onayla/reddet
- [ ] Onayda: İyzico refund API → stok geri ekle → müşteriye e-posta

## V3.6 — SMS Bildirimleri (Netgsm)

- [ ] Sipariş onayı SMS
- [ ] Kargoya verildi SMS + takip linki
- [ ] İade onaylandı SMS

## V3.7 — WhatsApp + Canlı Destek

- [ ] Sağ alt köşe sabit WhatsApp butonu
- [ ] Ürün detay sayfasında "WhatsApp ile Sor" butonu
- [ ] Tawk.to widget entegrasyonu

## V3.8 — KVKK ve Çerez

- [ ] Çerez onay banner'ı (ilk girişte)
- [ ] Çerez tercihleri: zorunlu / analitik / pazarlama
- [ ] GTM'e çerez tercihi bağla (onaylanmayan tag'lar tetiklenmez)
- [ ] Kayıt formunda açık rıza metni + checkbox
- [ ] `/hesabim/profil`'de "Verilerimi Sil" talebi formu
- [ ] `/gizlilik-politikasi` + `/kullanim-sartlari` + `/sss`

## V3.9 — Admin Genişletme

- [ ] `/admin/urunler` — CSV ile toplu fiyat/stok import + export
- [ ] `/admin/urunler` — görsel yükle (Supabase Storage, sürükle-bırak)
- [ ] `/admin/siparisler` — sipariş listesini Excel'e aktar
- [ ] `/admin/musteriler` — müşteri listesi + sipariş geçmişi
- [ ] `/admin/kampanyalar` — banner oluştur/düzenle/sırala
- [ ] Admin yorum yönetimi (`/admin/yorumlar`) — onayla/reddet

---

---

# V4 — Pazarlama ve Büyüme

> **Hedef:** Reklam, analitik, otomasyon — kullanıcı getir, geri getir.
> **Süre:** ~3 hafta

---

## V4.1 — Google Analytics 4 (Tam E-ticaret)

- [ ] GTM container kur
- [ ] GA4 e-ticaret olayları:
  `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`,
  `view_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `refund`
- [ ] GA4 kullanıcı özellikleri: locale, currency

## V4.2 — Meta Pixel (Facebook / Instagram Ads)

- [ ] GTM üzerinden Meta Pixel
- [ ] Standart olaylar: `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`
- [ ] **Conversions API** (server-side, iOS gizlilik için):
  - `POST /api/meta/event` → Meta Graph API

## V4.3 — Google Ads + Merchant Center

- [ ] GTM üzerinden Google Ads dönüşüm takibi + dinamik yeniden pazarlama
- [ ] `app/feed/google/route.ts` → XML ürün feed'i (fiyat, stok, kategori)
- [ ] Google Merchant Center domain doğrulama

## V4.4 — Microsoft Clarity

- [ ] GTM üzerinden Clarity kodu
- [ ] Session recording + heatmap ile UX sorunlarını tespit et

## V4.5 — Bülten

- [ ] Footer'da e-posta abonelik formu
- [ ] Double opt-in: doğrulama e-postası
- [ ] `/admin/bulten` — abone listesi, CSV export
- [ ] Abonelikten çıkma linki (KVKK zorunluluğu)

## V4.6 — Terk Edilmiş Sepet Kurtarma

- [ ] Cron job: sepette ürün bırakıp 1 saat çıkan kullanıcıya e-posta
- [ ] E-postada sepet özeti + "Siparişi Tamamla" butonu
- [ ] 24 saat sonra ikinci hatırlatma (opsiyonel)

## V4.7 — Ürün Yorumları

- [ ] Yorum formu: 1–5 yıldız, başlık, metin (giriş zorunlu)
- [ ] Admin onayından geçmeden yayınlanmaz
- [ ] Ortalama puan: ürün detay + listeleme kartında
- [ ] JSON-LD `Review` + `AggregateRating` → Google'da yıldız

## V4.8 — Gelişmiş Admin Raporları

- [ ] Dashboard: son 30 gün gelir grafiği (Recharts)
- [ ] `/admin/raporlar` — günlük/haftalık/aylık ciro, en çok satılan ürünler, en aktif müşteriler
- [ ] Tüm raporları Excel'e aktar
- [ ] Admin işlem logu (`/admin/log`): kim ne değiştirdi

## V4.9 — SEO (Tam)

- [ ] Her ürün sayfasında `generateMetadata` (başlık, açıklama, OG image, canonical)
- [ ] `app/sitemap.ts` — tüm ürün + kategori URL'leri
- [ ] `app/robots.ts`
- [ ] JSON-LD: `Product`, `BreadcrumbList`, `Organization`, `WebSite`
- [ ] 404 ve 500 özel hata sayfaları
- [ ] `next/image` — WebP otomatik, lazy loading
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1 hedefi

---

---

# V5 — Entegrasyonlar ve Olgunlaşma

> **Hedef:** Operasyonel verimliliği artır, uluslararası hazırlık, sağlamlaştırma.
> **Süre:** ~4–5 hafta

---

## V5.1 — Kargo API Entegrasyonu

- [ ] `lib/cargo/` — `createShipment(order)` adaptör katmanı
  - `yurtici.ts`, `aras.ts`, `mng.ts`
- [ ] Sipariş `paid` → otomatik kargo etiketi oluştur
- [ ] Takip no → `orders.cargo_tracking_no` → müşteriye SMS + e-posta
- [ ] Kargo etiketi PDF → Supabase Storage → admin indirir
- [ ] Admin panelinden manuel kargo şirketi seçimi

## V5.2 — E-Fatura (Paraşüt API)

- [ ] `lib/einvoice/parasut.ts` — `createInvoice(order)`
- [ ] Ödeme başarılı → otomatik e-Arşiv fatura kes
  - Bireysel: TC kimlik no ile
  - Kurumsal: vergi no + vergi dairesi ile
- [ ] Fatura PDF → Supabase Storage + müşteriye e-posta eki
- [ ] İade faturası (iptal faturası) → iade onayında otomatik
- [ ] `/admin/siparisler/[id]` — fatura görüntüle, yeniden gönder

## V5.3 — Çoklu Dil (TR + EN)

- [ ] `next-intl` — `/tr/...` ve `/en/...` URL yapısı
- [ ] `middleware.ts` — Accept-Language başlığına göre yönlendirme
- [ ] `messages/tr.json` + `messages/en.json`
- [ ] Tüm UI metinleri çevrilir
- [ ] `products.label_en`, `categories.name_en` kullanılır
- [ ] E-posta şablonları locale'e göre seçilir
- [ ] Yasal sayfalar EN versiyonu
- [ ] `hreflang` etiketleri (her sayfada TR ↔ EN)
- [ ] Sitemap'e EN URL'leri ekle

## V5.4 — Çoklu Para Birimi

- [ ] `/en` → EUR fiyat (`products.price_en`; boşsa TRY göster)
- [ ] Kur güncelleme: günlük cron (döviz API) veya admin'den manuel

## V5.5 — Güvenlik Sağlamlaştırma

- [ ] Tüm API routes: input validation (Zod)
- [ ] Rate limiting (Upstash): ödeme, giriş, kupon endpointleri
- [ ] Güvenli HTTP başlıkları (`next.config.js`): CSP, X-Frame-Options, HSTS
- [ ] İyzico webhook imza doğrulaması
- [ ] Meta Conversions API imza doğrulaması
- [ ] Supabase RLS: tüm tablolar için kapsamlı test

## V5.6 — Sentry + İzleme

- [ ] Sentry entegrasyonu: frontend + API hata yakalama
- [ ] Uptime monitoring (UptimeRobot veya Better Uptime)
- [ ] Supabase otomatik yedekleme (Pro plan)

## V5.7 — Performans

- [ ] `mann-filter-data.json` → Vercel CDN static file (bundle'dan çıkar)
- [ ] `@next/bundle-analyzer` — büyük paketleri tespit et
- [ ] Lighthouse skoru ≥ 90 (mobil + masaüstü)
- [ ] Yük testi: ödeme API + filtre sorgusu

---

---

## Özet Yol Haritası

| Versiyon | Ne kazanıyoruz | Tahmini Süre |
|---|---|---|
| **v2** | Ürün sat, ödeme al, siparişi yönet | 5–6 hafta |
| **v3** | Arama, favori, kupon, iade, SMS, WhatsApp, KVKK | 3–4 hafta |
| **v4** | GA4, Meta Pixel, Google Ads, bülten, terk sepet, yorumlar, raporlar | 3 hafta |
| **v5** | Kargo API, e-fatura, TR+EN, güvenlik, performans | 4–5 hafta |
| **Toplam** | | **~15–18 hafta** |

---

## Ortam Değişkenleri

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# İyzico
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox.iyzipay.com   # prod: https://api.iyzipay.com

# E-posta (v2)
RESEND_API_KEY=

# SMS (v3)
NETGSM_USERCODE=
NETGSM_PASSWORD=
NETGSM_MSGHEADER=       # max 11 karakter

# Analytics (v4)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=
META_ACCESS_TOKEN=       # Conversions API için
META_DATASET_ID=

# Kargo (v5)
YURTICI_API_KEY=
ARAS_API_KEY=
MNG_API_KEY=

# E-Fatura (v5)
PARASUT_CLIENT_ID=
PARASUT_CLIENT_SECRET=
PARASUT_COMPANY_ID=

# Site
NEXT_PUBLIC_SITE_URL=https://auto-filter.com
```
