# Auth Akışı ve UI İyileştirmeleri

**Tarih:** 2026-04-27
**Konu:** Supabase email confirmation redirect düzeltmesi, Google OAuth kayıt, anasayfa header iyileştirmeleri, hover efektleri.

---

## 1) Supabase Email Confirmation Localhost Sorunu

**Sorun:** Production'da kayıt olan kullanıcı confirmation mailindeki linke tıklayınca `localhost:3000`'e yönlendiriliyordu.

**Sebep:** Supabase, `emailRedirectTo` URL'ini yalnızca Dashboard'daki **Redirect URLs** allowlist'inde varsa kullanıyor; eşleşme yoksa Site URL'a (localhost olarak ayarlıydı) düşüyor. Ayrıca kod, `headers().get("origin")`'e öncelik veriyordu — preview/proxy/custom domain durumlarında güvenilmez.

**Kod düzeltmesi:** Üç action'da öncelik sırası `NEXT_PUBLIC_SITE_URL` → header'a çevrildi.

- `app/(auth)/kayit/actions.ts:27`
- `app/(auth)/sifremi-unuttum/actions.ts:12`
- `app/(auth)/giris/actions.ts:32` (Google OAuth redirect)

```ts
// Önce: headersList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL
// Şimdi: process.env.NEXT_PUBLIC_SITE_URL ?? headersList.get("origin")
```

**Kullanıcı tarafı (kullanıcı yapacak):**
- Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: `https://auto-filter-store.vercel.app`
  - Redirect URLs allowlist'e: `https://auto-filter-store.vercel.app/**` ve `http://localhost:3000/**`
- Vercel env: `NEXT_PUBLIC_SITE_URL=https://auto-filter-store.vercel.app`

---

## 2) Google OAuth ile Kayıt

**Durum:** `signInWithGoogle` action'ı `app/(auth)/giris/actions.ts:29`'da zaten vardı ve giriş sayfasında kullanılıyordu. Supabase OAuth ilk seferde otomatik kayıt yapar — yeni kullanıcılar için `handle_new_user` trigger'ı (`scripts/schema.sql:264`) profile kaydı oluşturuyor.

**Yapılan:** Aynı action'ı kayıt formuna da bağladım.

- `app/(auth)/kayit/KayitForm.tsx`:
  - `signInWithGoogle` import edildi (`../giris/actions`)
  - Stil objesine `btnGoogle`, `divider`, `dividerLine`, `dividerText` eklendi
  - Form altına "veya" ayracı + Google logolu "Google ile Kayıt Ol" butonu

**Karşılaşılan hata ve çözüm:**
Google butonuna basınca `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}` döndü. Sebep: Supabase Dashboard'da Google provider için Client ID/Secret girilmemişti.

**Çözüm adımları (kullanıcı yapacak):**
1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID oluştur (Web application).
2. Authorized redirect URIs'e Supabase callback URL'sini ekle: `https://tdqeaxhufcnafvyqgjgb.supabase.co/auth/v1/callback`
3. OAuth consent screen'i doldur (test users / publish).
4. Supabase Dashboard → Authentication → Providers → Google: Client ID + Client Secret yapıştır + enable.

---

## 3) Anasayfa Header — Karşılama ve Çıkış

**Talep:** Login olunca sağ üstte "Hoşgeldin {isim}" + Çıkış Yap butonu.

**Yapılan:** `app/page.tsx`:
- `signOut` action import edildi (`@/app/hesabim/actions`)
- Login varsa `profiles.full_name` çekiliyor, yoksa fallback zinciri: `user_metadata.full_name` → `user_metadata.name` (Google) → `email`
- Header'a "Hoşgeldin {isim}" span'i + Hesabım linki + Çıkış Yap butonu (form action)
- Yeni stiller: `greeting`, `greetingName`, `logoutBtn`

```ts
displayName =
  profile?.full_name ||
  (user.user_metadata?.full_name as string | undefined) ||
  (user.user_metadata?.name as string | undefined) ||
  user.email ||
  null;
```

---

## 4) Hover Efektleri

**Talep:** Sağ üstteki "Ürünler" yazısının tıklanabilir olduğu belli olsun + ürün kartları hover'da feedback versin.

**Sorun:** Mevcut kod inline style kullanıyor, `:hover` pseudo-class çalışmıyor.

**Çözüm:** `app/globals.css`'e iki utility sınıfı:

```css
.nav-link {
  transition: color 0.15s, background 0.15s;
}
.nav-link:hover {
  color: #e5e5e5;
  background: #161616;
}

.product-card {
  transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s, background 0.18s;
}
.product-card:hover {
  border-color: #3a4f6e !important;
  background: #131313;
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}
```

**Uygulanan yerler:**
- `app/page.tsx` — Ürünler / Giriş Yap / Çıkış Yap linklerine `className="nav-link"`
- `app/(store)/urunler/page.tsx` — Ana Sayfa / Hesabım linklerine `nav-link`, ürün kartlarına `product-card`

---

## 5) Çıkış Sonrası Yönlendirme

**Talep:** Çıkış yapınca `/giris` yerine anasayfaya gitsin.

**Yapılan:** `app/hesabim/actions.ts:10` — `redirect("/giris")` → `redirect("/")`.

---

## Değiştirilen Dosyalar

- `app/(auth)/kayit/actions.ts` — origin önceliği
- `app/(auth)/kayit/KayitForm.tsx` — Google butonu eklendi
- `app/(auth)/sifremi-unuttum/actions.ts` — origin önceliği
- `app/(auth)/giris/actions.ts` — origin önceliği
- `app/page.tsx` — karşılama mesajı + çıkış butonu + nav-link sınıfları
- `app/(store)/urunler/page.tsx` — nav-link + product-card sınıfları
- `app/hesabim/actions.ts` — signOut artık `/`'a yönlendiriyor
- `app/globals.css` — `.nav-link` ve `.product-card` hover stilleri

---

## Açık Kalan / Kullanıcının Yapacakları

1. **Supabase Dashboard:** Site URL + Redirect URLs allowlist
2. **Vercel:** `NEXT_PUBLIC_SITE_URL` production env değişkeni
3. **Google Cloud Console + Supabase:** Google OAuth Client ID/Secret kurulumu
