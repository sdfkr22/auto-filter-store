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
  product_name: string;
  product_fancy_name: string;
  product_type: "mann" | "filtron";
  label: string;
  image_url: string | null;
  equivalent?: string;
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
  console.log("Kategoriler:", Object.keys(categoryMap).join(", "));

  const raw = fs.readFileSync(
    path.resolve(process.cwd(), "products.json"),
    "utf-8"
  );
  const products: RawProduct[] = JSON.parse(raw);
  console.log(`${products.length} ürün bulundu.`);

  // Adım 1: product_name'e göre tekilleştir (aynı Filtron kodu birden fazla MANN'e eşdeğer olabilir)
  const seen = new Set<string>();
  const unique = products.filter((p) => {
    if (seen.has(p.product_name)) return false;
    seen.add(p.product_name);
    return true;
  });
  console.log(`${unique.length} benzersiz ürün upsert edilecek (${products.length - unique.length} tekrar atlandı).`);

  const rows = unique.map((p) => ({
    product_name: p.product_name,
    product_fancy_name: p.product_fancy_name,
    product_type: p.product_type,
    label: p.label,
    image_url: p.image_url ?? null,
    category_id: categoryMap[labelToSlug(p.label)] ?? null,
    active: true,
  }));

  const BATCH = 200;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "product_name", ignoreDuplicates: false });
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} hatası:`, error.message);
      process.exit(1);
    }
    upserted += batch.length;
    console.log(`${upserted}/${rows.length} ürün upsert edildi...`);
  }

  // Adım 2: equivalent_id'yi güncelle
  console.log("\nEquivalent ID'ler güncelleniyor...");

  const { data: allProducts } = await supabase
    .from("products")
    .select("id, product_name");

  if (!allProducts) {
    console.error("Ürünler çekilemedi.");
    process.exit(1);
  }

  const idByName: Record<string, string> = {};
  allProducts.forEach((p) => { idByName[p.product_name] = p.id; });

  const withEquivalent = products.filter((p) => p.equivalent);
  let linked = 0;

  for (const p of withEquivalent) {
    const myId = idByName[p.product_name];
    const eqId = p.equivalent ? idByName[p.equivalent] : undefined;

    if (!myId || !eqId) continue;

    const { error } = await supabase
      .from("products")
      .update({ equivalent_id: eqId })
      .eq("id", myId);

    if (error) {
      console.warn(`${p.product_name} → ${p.equivalent} bağlantısı kurulamadı:`, error.message);
    } else {
      linked++;
    }
  }

  console.log(`\n✓ Migration tamamlandı.`);
  console.log(`  ${upserted} ürün upsert edildi.`);
  console.log(`  ${linked} equivalent bağlantısı kuruldu.`);
}

main();
