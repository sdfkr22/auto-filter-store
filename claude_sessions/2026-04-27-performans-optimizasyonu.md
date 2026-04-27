# Performans Optimizasyonu — 9 Adım

**Tarih:** 2026-04-27
**Hedef:** `/urunler` sayfası ve anasayfanın yavaş açılma süresini azaltmak.

---

## Önceki Görev: Ürün Sayfası URL Değişimi

Ürün sayfası linki `products.id` (UUID) yerine `products.product_name` kullanacak şekilde güncellendi.

- `app/(store)/urun/[id]/page.tsx` → `app/(store)/urun/[...name]/page.tsx` (catch-all route)
- `product_name` içinde `/` olabildiği için (`C1036/1` gibi) catch-all gerekiyor
- Params: `Promise<{ name: string[] }>`, `name.map(decodeURIComponent).join("/")` ile birleştiriliyor
- Tüm `Link href` referansları güncellendi

---

## Adım 1 — `lib/mann-data.ts` (modül düzeyi cache + index)

**Sorun:** 7.7 MB `mann-filter-data.json` her API çağrısında parse ediliyor.

**Çözüm:**
- Modül düzeyinde lazy-loaded cache: `_data` ve `_byCode: Map<normCode, Entry[]>`
- `norm(code)` helper: boşlukları silip uppercase yapıyor
- `getMannData()`, `getCompatibleVehicles(mannCode)`, `toArray(...)` export

```ts
let _data: Entry[] | null = null;
let _byCode: Map<string, Entry[]> | null = null;
export const norm = (c: string) => c.replace(/\s+/g, "").toUpperCase();
```

---

## Adım 2 — `proxy.ts` matcher daraltma

**Sorun:** Middleware her istekte (statik dosyalar dahil) Supabase auth check yapıyordu.

**Çözüm:** Matcher sadece korunan path'lere indirgendi:
```ts
matcher: [
  "/hesabim", "/hesabim/:path*",
  "/sepet", "/sepet/:path*",
  "/odeme", "/odeme/:path*",
  "/admin", "/admin/:path*",
]
```

Redirect logic basitleştirildi: `!user` → `/giris?next=...`.

---

## Adım 3 — DB Indexleri

**Migration:** `supabase/migration_v4_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS products_label_active_idx
  ON public.products (label, product_name) WHERE active = true;

CREATE INDEX IF NOT EXISTS products_type_active_idx
  ON public.products (product_type) WHERE active = true;

CREATE INDEX IF NOT EXISTS products_equivalent_idx
  ON public.products (equivalent_id) WHERE equivalent_id IS NOT NULL;
```

**Not:** Eski v2 migration'dan kalan gereksiz `products_mann_code_key` constraint'i drop edilmesi önerildi:
```sql
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_mann_code_key;
```

---

## Adım 4 — `next/image` + `remotePatterns`

**Sorun:** `<img>` tag'leri optimizasyonsuz, lazy-load yok.

**Çözüm:**
- `next.config.ts` içine `remotePatterns`: `s7g10.scene7.com`, `filtron.eu`
- `/urunler` ürün kartlarında `<Image fill sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 200px">`
- `FilterWidget.tsx` hover preview'larında `<Image width={160} height={160} sizes="160px">`
- `/urun/[...name]` için `ProductImage.tsx` client component (error fallback ile)

---

## Adım 5 — `lib/supabase/anon.ts` (cookie-less singleton)

**Sorun:** Cookie tabanlı server client `unstable_cache` ile uyumsuz.

**Çözüm:**
```ts
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);
```

RLS public_read policy zaten yeterli.

---

## Adım 6 — `/urunler` pagination + `unstable_cache`

**Sorun:** Tüm ürünler tek seferde çekiliyor, sayfalama yok.

**Çözüm:**
- `PAGE_SIZE = 48`, `.range(start, end)` + `count: "exact"`
- `getCategories()` ve `getProductsPage(label, page)` `unstable_cache` ile sarmalandı (revalidate: 3600, tag: "products")
- Pagination UI + `buildUrl(p)` helper
- Ürün kartı linki: `/urun/${p.product_name}` (UUID değil)

---

## Adım 7 — `/api/filters` Cache-Control headers

**Çözüm:**
```ts
const CACHE_STATIC  = "public, s-maxage=86400, stale-while-revalidate=604800";
const CACHE_RESULTS = "public, s-maxage=600, stale-while-revalidate=3600";
```

`jsonWithCache(body, cacheControl)` helper ile tüm response'lara uygulandı.

---

## Adım 8 — Build-time `filter-tree.json`

**Sorun:** makes/models/engines listeleri için 7.7 MB JSON parse maliyeti.

**Çözüm:**
- `scripts/build-filter-tree.ts`: `Record<make, Record<model, engineString[]>>` türetiyor
- Output: **890 KB** (vs 7.7 MB), 55 marka, 2249 model, 23607 motor
- `package.json` scripts:
  ```json
  "prebuild":    "tsx scripts/build-filter-tree.ts",
  "postinstall": "tsx scripts/build-filter-tree.ts"
  ```
- `.gitignore`: `/lib/filter-tree.json` (derived)
- API route artık `tree[make]?.[model]` ile O(1) lookup yapıyor

---

## Adım 9 — Ürün detay sayfası tek-query + cache

**Sorun:** `generateMetadata` ve page render iki ayrı Supabase çağrısı yapıyordu.

**Çözüm:**
- `getProduct(productName)` `unstable_cache` ile sarmalandı
- Supabase **embedded select** ile ürün + eşdeğeri tek query'de çekiliyor:
  ```ts
  .select(`${PRODUCT_FIELDS}, equivalent:equivalent_id (${PRODUCT_FIELDS})`)
  ```
- Hem metadata hem render aynı cache key'i paylaşıyor → dedupe
- `const { equivalent, ...product } = full;` ile temiz tip ayrımı
- `lib/supabase/server` (cookies) yerine `supabaseAnon` kullanılıyor
- Cache: `revalidate: 3600`, tag: `"products"`

---

## Beklenen Kazanımlar

| Adım | Sayfa/Endpoint | Beklenen İyileşme |
|------|----------------|-------------------|
| 1, 8 | `/api/filters` (makes/models/engines) | 7.7 MB parse → 890 KB / O(1) lookup |
| 2 | Tüm sayfalar (statik dahil) | Middleware overhead'den kurtulma |
| 3 | `/urunler`, `/urun/...`, filtre sonuçları | Index scan |
| 4 | `/urunler`, FilterWidget | Lazy-load + responsive image |
| 5, 6, 9 | `/urunler`, `/urun/...` | `unstable_cache` + pagination |
| 7 | `/api/filters` | CDN cache + SWR |

---

## Yapılması Gerekenler (Kullanıcı Tarafı)

1. ✅ `migration_v4_indexes.sql` Supabase SQL Editor'da çalıştırıldı
2. (öneri) `ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_mann_code_key;`
3. `npm install` → `postinstall` script'i `lib/filter-tree.json`'u üretsin
4. Prod doğrulama: `npm run build && npm start` (dev modunda `next/image` ve cache headers tam çalışmıyor)

---

## Değiştirilen / Eklenen Dosyalar

**Yeni:**
- `app/(store)/urun/[...name]/page.tsx`
- `app/(store)/urun/[...name]/ProductImage.tsx`
- `lib/mann-data.ts`
- `lib/supabase/anon.ts`
- `scripts/build-filter-tree.ts`
- `supabase/migration_v4_indexes.sql`

**Güncellenen:**
- `proxy.ts`
- `next.config.ts`
- `app/(store)/urunler/page.tsx`
- `app/api/filters/route.ts`
- `components/FilterWidget.tsx`
- `package.json`
- `.gitignore`

**Silinen:**
- `app/(store)/urun/[id]/` (catch-all'a taşındı)
