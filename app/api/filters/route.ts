import { NextRequest, NextResponse } from "next/server";
import { getMannData, toArray, norm } from "@/lib/mann-data";
import { supabaseAnon } from "@/lib/supabase/anon";
import filterTree from "@/lib/filter-tree.json";

// Statik liste cevapları (makes/models/engines): JSON dosyasından türetiliyor,
// pratik olarak hiç değişmiyor → CDN/browser uzun cache + uzun stale-while-revalidate.
const CACHE_STATIC = "public, s-maxage=86400, stale-while-revalidate=604800";
// Sonuç cevapları: stok/fiyat içerdiği için kısa CDN cache + makul stale.
const CACHE_RESULTS = "public, s-maxage=600, stale-while-revalidate=3600";

function jsonWithCache(body: unknown, cacheControl: string) {
  return NextResponse.json(body, { headers: { "Cache-Control": cacheControl } });
}

type DbProduct = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  equivalent_id: string | null;
};

type DbEquivalent = {
  id: string;
  product_name: string;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
};

// JSON kodu "C 10 011" (boşluklu), DB product_name "C10011" (boşuksuz) — norm `lib/mann-data` üzerinden

const FILTER_TYPES = [
  { key: "oil"   as const, label: "Yağ Filtresi",   icon: "🛢️" },
  { key: "air"   as const, label: "Hava Filtresi",  icon: "💨" },
  { key: "cabin" as const, label: "Polen Filtresi", icon: "🌿" },
  { key: "fuel"  as const, label: "Yakıt Filtresi", icon: "⛽" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type   = searchParams.get("type");
  const make   = searchParams.get("make")   ?? "";
  const model  = searchParams.get("model")  ?? "";
  const engine = searchParams.get("engine") ?? "";
  // Marka/model/motor: 7.7 MB JSON yerine build-time'da derlenmiş küçük ağaç
  const tree = filterTree as Record<string, Record<string, string[]>>;

  if (type === "makes") {
    return jsonWithCache(Object.keys(tree), CACHE_STATIC);
  }

  if (type === "models") {
    if (!make) return jsonWithCache([], CACHE_STATIC);
    return jsonWithCache(Object.keys(tree[make] ?? {}), CACHE_STATIC);
  }

  if (type === "engines") {
    if (!make || !model) return jsonWithCache([], CACHE_STATIC);
    return jsonWithCache(tree[make]?.[model] ?? [], CACHE_STATIC);
  }

  if (type === "results") {
    if (!make || !model || !engine) return jsonWithCache(null, CACHE_RESULTS);
    // results yolu hâlâ tam veriyi tarıyor (uyumluluk için tüm filtre kodları lazım)
    const data = getMannData();

    // engine param: "1.6 TDi — 115 PS / 85 kW" → base name "1.6 TDi"
    const engineBase = engine.includes(" — ") ? engine.split(" — ")[0] : engine;

    const entries = data.filter(
      (e) => e.make === make && e.model === model && e.engine === engineBase
    );
    if (!entries.length) return jsonWithCache(null, CACHE_RESULTS);

    // Her filtre türü için benzersiz MANN kodlarını topla
    const codesByType: Record<string, string[]> = { oil: [], air: [], cabin: [], fuel: [] };
    for (const entry of entries) {
      for (const { key } of FILTER_TYPES) {
        for (const code of toArray(entry[key])) {
          if (!codesByType[key].includes(code)) codesByType[key].push(code);
        }
      }
    }

    const allCodes = Object.values(codesByType).flat();
    if (!allCodes.length) return jsonWithCache(null, CACHE_RESULTS);

    // JSON kodu (boşluklu) → normalleştirilmiş (boşuksuz) mapping
    const originalByNorm: Record<string, string> = {};
    allCodes.forEach((c) => { originalByNorm[norm(c)] = c; });
    const normalizedCodes = allCodes.map(norm);

    // 1. MANN ürünlerini çek (product_type = 'mann')
    const { data: mannRows } = await supabaseAnon
      .from("products")
      .select("id, product_name, product_fancy_name, image_url, price, compare_price, stock, equivalent_id")
      .eq("product_type", "mann")
      .in("product_name", normalizedCodes);


    // 2. Filtron eşdeğerlerini çek (equivalent_id'ler üzerinden)
    const equivalentIds = (mannRows ?? [])
      .map((r) => r.equivalent_id)
      .filter((id): id is string => id !== null);

    let filtronById: Record<string, DbEquivalent> = {};
    if (equivalentIds.length > 0) {
      const { data: filtronRows } = await supabaseAnon
        .from("products")
        .select("id, product_name, image_url, price, compare_price, stock")
        .eq("product_type", "filtron")
        .in("id", equivalentIds);
      filtronById = Object.fromEntries(
        (filtronRows ?? []).map((f) => [f.id, f as DbEquivalent])
      );
    }

    // DB satırlarını orijinal (boşluklu) JSON koduyla indeksle
    const byOriginal: Record<string, DbProduct> = {};
    for (const row of mannRows ?? []) {
      const orig = originalByNorm[row.product_name];
      if (orig) byOriginal[orig] = row as DbProduct;
    }

    const filterGroups = FILTER_TYPES
      .map(({ key, label, icon }) => {
        const codes = codesByType[key];
        if (!codes.length) return null;

        const items = codes.map((code) => {
          const mann = byOriginal[code] ?? null;
          const filtron = mann?.equivalent_id ? filtronById[mann.equivalent_id] ?? null : null;
          return {
            mannProductId:    mann?.id ?? null,
            mannCode:         mann?.product_name ?? norm(code),
            mannFancyName:    mann?.product_fancy_name ?? null,
            mannImageUrl:     mann?.image_url ?? null,
            mannPrice:        mann?.price ?? 0,
            mannComparePrice: mann?.compare_price ?? null,
            mannStock:        mann?.stock ?? 0,
            mannFound:        mann !== null,
            filtronProductId:    filtron?.id ?? null,
            filtronCode:         filtron?.product_name ?? null,
            filtronImageUrl:     filtron?.image_url ?? null,
            filtronPrice:        filtron?.price ?? 0,
            filtronComparePrice: filtron?.compare_price ?? null,
            filtronStock:        filtron?.stock ?? 0,
          };
        });

        return { type: key, label, icon, items };
      })
      .filter(Boolean);

    const first = entries[0];
    return jsonWithCache({
      vehicle: {
        make: first.make, model: first.model, engine: first.engine,
        kw: first.kw, ps: first.ps, year_of_prod: first.year_of_prod,
      },
      filterGroups,
    }, CACHE_RESULTS);
  }

  return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
}
