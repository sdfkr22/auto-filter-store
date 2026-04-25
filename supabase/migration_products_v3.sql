-- ============================================================
-- products tablosu v3 migrasyonu
-- products.json yeni yapısına göre son haline getir
-- Hem eski (mann_code) hem v2 (product_name) durumdan çalışır
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- 1. Eski sütun adlarını yeniden adlandır (varsa)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'mann_code') THEN
    ALTER TABLE public.products RENAME COLUMN mann_code TO product_name;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'mann_name') THEN
    ALTER TABLE public.products RENAME COLUMN mann_name TO product_fancy_name;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'mann_url') THEN
    ALTER TABLE public.products RENAME COLUMN mann_url TO image_url;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'label_tr') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'label') THEN
      ALTER TABLE public.products RENAME COLUMN label_tr TO label;
    ELSE
      ALTER TABLE public.products DROP COLUMN label_tr;
    END IF;
  END IF;
END $$;

-- 2. Yeni sütunları ekle (yoksa)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_fancy_name TEXT,
  ADD COLUMN IF NOT EXISTS product_type        TEXT NOT NULL DEFAULT 'mann',
  ADD COLUMN IF NOT EXISTS label               TEXT,
  ADD COLUMN IF NOT EXISTS image_url           TEXT,
  ADD COLUMN IF NOT EXISTS equivalent_id       UUID,
  ADD COLUMN IF NOT EXISTS compare_price       NUMERIC;

-- 3. Gereksiz eski sütunları kaldır
ALTER TABLE public.products
  DROP COLUMN IF EXISTS filtron_code,
  DROP COLUMN IF EXISTS filtron_url,
  DROP COLUMN IF EXISTS label_en,
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS price_en;

-- 4. product_name üzerinde UNIQUE kısıtı (yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_product_name_key'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_product_name_key UNIQUE (product_name);
  END IF;
END $$;

-- 5. equivalent_id FK kısıtı (yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_equivalent_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_equivalent_id_fkey
      FOREIGN KEY (equivalent_id) REFERENCES public.products(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- order_items tablosu: mann_code → product_code
-- (artık hem MANN hem Filtron ürünü sipariş edilebilir)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'mann_code') THEN
    ALTER TABLE public.order_items RENAME COLUMN mann_code TO product_code;
  END IF;
END $$;

-- ============================================================
-- Sonuç kontrol:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'products'
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'order_items'
-- ORDER BY ordinal_position;
-- ============================================================
