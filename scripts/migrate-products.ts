import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RawProduct = {
  mann: string;
  mann_name: string;
  label: string;
  mann_url: string | null;
  filtron: string | null;
  filtron_url: string | null;
};

function labelToSlug(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("yag") || l.includes("yağ")) return "yag-filtresi";
  if (l.includes("kabin") || l.includes("polen")) return "polen-filtresi";
  if (l.includes("yakit") || l.includes("yakıt")) return "yakit-filtresi";
  if (l.includes("hava")) return "hava-filtresi";
  return "hava-filtresi";
}

async function main() {
  console.log("Kategoriler yükleniyor...");
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug");

  if (catErr || !categories) {
    console.error("Kategori hatası:", catErr);
    process.exit(1);
  }

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => { categoryMap[c.slug] = c.id; });
  console.log("Kategoriler:", categoryMap);

  const raw = fs.readFileSync(
    path.resolve(process.cwd(), "products.json"),
    "utf-8"
  );
  const products: RawProduct[] = JSON.parse(raw);
  console.log(`${products.length} ürün bulundu.`);

  // Eşsiz mann_code'lara göre tekilleştir
  const seen = new Set<string>();
  const unique = products.filter((p) => {
    if (seen.has(p.mann)) return false;
    seen.add(p.mann);
    return true;
  });
  console.log(`${unique.length} eşsiz ürün migrate edilecek.`);

  const rows = unique.map((p) => ({
    mann_code: p.mann,
    mann_name: p.mann_name,
    filtron_code: p.filtron ?? null,
    category_id: categoryMap[labelToSlug(p.label)],
    label_tr: p.label,
    mann_url: p.mann_url ?? null,
    filtron_url: p.filtron_url ?? null,
    price: 0,
    stock: 0,
    active: true,
    featured: false,
  }));

  // 200'lük batch'ler halinde yükle
  const BATCH = 200;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("products").insert(batch);
    if (error) {
      console.error(`Batch ${i / BATCH + 1} hatası:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`${inserted}/${rows.length} ürün yüklendi...`);
  }

  console.log(`\n✓ Migration tamamlandı. ${inserted} ürün Supabase'e yüklendi.`);
}

main();
