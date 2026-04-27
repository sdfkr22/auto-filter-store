-- ============================================================
-- v4: products tablosu performans indeksleri
-- /urunler ve /api/filters sorgu hızı için
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- /urunler?kategori=... → .eq("active", true).eq("label", label).order("product_name")
-- Partial index: yalnız aktif ürünleri kapsar (tablo daha küçük olur)
CREATE INDEX IF NOT EXISTS products_label_active_idx
  ON public.products (label, product_name)
  WHERE active = true;

-- /api/filters → .eq("product_type", "mann").in("product_name", codes)
-- product_name zaten UNIQUE indeksli; product_type için ek partial index
CREATE INDEX IF NOT EXISTS products_type_active_idx
  ON public.products (product_type)
  WHERE active = true;

-- Ürün detay → product.equivalent_id → ikinci ürün lookup
-- equivalent_id'nin null olmadığı satırları indeksle
CREATE INDEX IF NOT EXISTS products_equivalent_idx
  ON public.products (equivalent_id)
  WHERE equivalent_id IS NOT NULL;

-- ============================================================
-- Doğrulama
-- ============================================================
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'products'
-- ORDER BY indexname;
--
-- EXPLAIN ANALYZE
-- SELECT id, product_name FROM products
-- WHERE active = true AND label = 'Hava filtresi'
-- ORDER BY product_name;
-- → Index Scan using products_label_active_idx görmelisiniz
-- ============================================================
