import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnon } from "@/lib/supabase/anon";

export const dynamic = "force-dynamic";

export type SearchHit = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  product_type: string;
  label: string | null;
  image_url: string | null;
  price: number;
  stock: number;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "8");
  const limit = Math.min(Math.max(1, limitParam || 8), 50);

  if (q.length < 2) return NextResponse.json({ hits: [] });

  // PostgREST `or` filtresi için karakterleri escape et (virgül/parantez/yıldız problem çıkarır)
  const safe = q.replace(/[%_,()*]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) return NextResponse.json({ hits: [] });

  const pattern = `%${safe}%`;

  const { data, error } = await supabaseAnon
    .from("products")
    .select("id, product_name, product_fancy_name, product_type, label, image_url, price, stock")
    .eq("active", true)
    .or(`product_name.ilike.${pattern},product_fancy_name.ilike.${pattern}`)
    .order("stock", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ hits: [], error: "Arama başarısız." }, { status: 500 });
  }

  return NextResponse.json({ hits: data ?? [] });
}
