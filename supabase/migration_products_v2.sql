-- ============================================================
-- products tablosu v2 migrasyonu
-- MANN ve Filtron artık ayrı satırlar; equivalent_id ile bağlı
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- 1. Sütun isimlerini güncelle
ALTER TABLE products RENAME COLUMN mann_code TO product_name;
ALTER TABLE products RENAME COLUMN mann_name TO product_fancy_name;
ALTER TABLE products RENAME COLUMN mann_url TO image_url;

-- 2. product_name üzerine UNIQUE kısıtı ekle (henüz yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_product_name_key'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_product_name_key UNIQUE (product_name);
  END IF;
END $$;

-- 3. Yeni sütunları ekle
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'mann',
  ADD COLUMN IF NOT EXISTS label       TEXT,
  ADD COLUMN IF NOT EXISTS equivalent_id UUID;

-- 4. Mevcut MANN ürünlerinin label'larını products.json'daki değerlerle doldur
--    (Supabase'e ilk yüklemede label yoksa bu adım önemli)
--    Ürünleri tek tek güncellemek yerine filtron_code'dan türetilebilecek
--    veriler için boş bırakın; categories tablosu zaten var.

-- 5. Benzersiz Filtron ürünlerini ayrı satır olarak ekle
--    Fiyat/stok 0 başlar, sonradan manuel güncellenir
INSERT INTO products (product_name, product_type, image_url, price, stock, active)
SELECT DISTINCT
  filtron_code AS product_name,
  'filtron'   AS product_type,
  filtron_url AS image_url,
  0           AS price,
  0           AS stock,
  true        AS active
FROM products
WHERE filtron_code IS NOT NULL
  AND filtron_code <> ''
ON CONFLICT (product_name) DO NOTHING;

-- 6. MANN → Filtron bağlantısı (equivalent_id)
UPDATE products AS m
SET equivalent_id = f.id
FROM products AS f
WHERE m.product_type = 'mann'
  AND m.filtron_code IS NOT NULL
  AND f.product_type = 'filtron'
  AND f.product_name = m.filtron_code;

-- 7. Filtron → MANN bağlantısı (geri yönlü, bir MANN'i işaret eder)
UPDATE products AS f
SET equivalent_id = m.id
FROM products AS m
WHERE f.product_type = 'filtron'
  AND f.equivalent_id IS NULL
  AND m.product_type = 'mann'
  AND m.equivalent_id = f.id;

-- 8. FK kısıtı ekle
ALTER TABLE products
  ADD CONSTRAINT products_equivalent_id_fkey
  FOREIGN KEY (equivalent_id) REFERENCES products(id)
  ON DELETE SET NULL;

-- 9. Eski Filtron sütunlarını kaldır
ALTER TABLE products
  DROP COLUMN IF EXISTS filtron_code,
  DROP COLUMN IF EXISTS filtron_url;

-- ============================================================
-- Sonuç kontrol sorguları:
-- SELECT product_type, count(*) FROM products GROUP BY product_type;
-- → mann: ~2565, filtron: ~1892
--
-- SELECT count(*) FROM products WHERE product_type='mann' AND equivalent_id IS NOT NULL;
-- → ~2191 (filtron muadili olan MANN ürünler)
-- ============================================================
