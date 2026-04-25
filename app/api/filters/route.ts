import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

type Entry = {
  make: string; model: string; engine: string | null;
  kw: number | null; ps: number | null; year_of_prod: string | null;
  air: string | string[] | null; oil: string | string[] | null;
  fuel: string | string[] | null; cabin: string | string[] | null;
};

function toArray(val: string | string[] | null | undefined): string[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

type DbProduct = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  image_url: string | null;
  price: number;
  stock: number;
  equivalent_id: string | null;
};

type DbEquivalent = {
  id: string;
  product_name: string;
  image_url: string | null;
  price: number;
  stock: number;
};

let _cache: Entry[] | null = null;
function getData(): Entry[] {
  if (!_cache) {
    const p = path.join(process.cwd(), "mann-filter-data.json");
    _cache = JSON.parse(fs.readFileSync(p, "utf-8")) as Entry[];
  }
  return _cache;
}

// JSON kodu "C 10 011" (boşluklu), DB product_name "C10011" (boşuksuz)
const norm = (c: string) => c.replace(/\s+/g, "").toUpperCase();

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
  const data   = getData();

  if (type === "makes") {
    return NextResponse.json([...new Set(data.map((e) => e.make))].sort());
  }

  if (type === "models") {
    if (!make) return NextResponse.json([]);
    return NextResponse.json(
      [...new Set(data.filter((e) => e.make === make).map((e) => e.model))].sort()
    );
  }

  if (type === "engines") {
    if (!make || !model) return NextResponse.json([]);
    return NextResponse.json(
      [...new Set(
        data
          .filter((e) => e.make === make && e.model === model && e.engine && e.kw && e.ps)
          .map((e) => `${e.engine} — ${e.ps} PS / ${e.kw} kW`)
      )].sort()
    );
  }

  if (type === "results") {
    if (!make || !model || !engine) return NextResponse.json(null);

    // engine param: "1.6 TDi — 115 PS / 85 kW" → base name "1.6 TDi"
    const engineBase = engine.includes(" — ") ? engine.split(" — ")[0] : engine;

    const entries = data.filter(
      (e) => e.make === make && e.model === model && e.engine === engineBase
    );
    if (!entries.length) return NextResponse.json(null);

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
    if (!allCodes.length) return NextResponse.json(null);

    // JSON kodu (boşluklu) → normalleştirilmiş (boşuksuz) mapping
    const originalByNorm: Record<string, string> = {};
    allCodes.forEach((c) => { originalByNorm[norm(c)] = c; });
    const normalizedCodes = allCodes.map(norm);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. MANN ürünlerini çek (product_type = 'mann')
    const { data: mannRows } = await supabase
      .from("products")
      .select("id, product_name, product_fancy_name, image_url, price, stock, equivalent_id")
      .eq("product_type", "mann")
      .in("product_name", normalizedCodes);


    // 2. Filtron eşdeğerlerini çek (equivalent_id'ler üzerinden)
    const equivalentIds = (mannRows ?? [])
      .map((r) => r.equivalent_id)
      .filter((id): id is string => id !== null);

    let filtronById: Record<string, DbEquivalent> = {};
    if (equivalentIds.length > 0) {
      const { data: filtronRows } = await supabase
        .from("products")
        .select("id, product_name, image_url, price, stock")
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
            mannProductId:  mann?.id ?? null,
            mannCode:       mann?.product_name ?? norm(code),
            mannFancyName:  mann?.product_fancy_name ?? null,
            mannImageUrl:   mann?.image_url ?? null,
            mannPrice:      mann?.price ?? 0,
            mannStock:      mann?.stock ?? 0,
            mannFound:      mann !== null,
            filtronProductId: filtron?.id ?? null,
            filtronCode:      filtron?.product_name ?? null,
            filtronImageUrl:  filtron?.image_url ?? null,
            filtronPrice:     filtron?.price ?? 0,
            filtronStock:     filtron?.stock ?? 0,
          };
        });

        return { type: key, label, icon, items };
      })
      .filter(Boolean);

    const first = entries[0];
    return NextResponse.json({
      vehicle: {
        make: first.make, model: first.model, engine: first.engine,
        kw: first.kw, ps: first.ps, year_of_prod: first.year_of_prod,
      },
      filterGroups,
    });
  }

  return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
}
