import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/anon";

// Misafir sepeti hidrasyonu — localStorage'daki ürün ID'leri için detayları döndür.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "ids must be string[]" }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ products: [] });
  if (ids.length > 200) return NextResponse.json({ error: "too many ids" }, { status: 400 });

  const { data, error } = await supabaseAnon
    .from("products")
    .select("id, product_name, product_fancy_name, product_type, image_url, price, compare_price, stock, active")
    .in("id", ids)
    .eq("active", true);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ products: data ?? [] });
}
