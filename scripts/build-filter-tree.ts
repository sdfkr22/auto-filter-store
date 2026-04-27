// mann-filter-data.json (~7.7 MB) içinden marka → model → motor ağacını
// türetip lib/filter-tree.json (~küçük, KB seviyesi) olarak yazar.
// API route (/api/filters) bu küçük JSON'u import edip dropdown'lar için
// kullanır; cold start'ta 7.7 MB parse maliyeti ortadan kalkar.
//
// Çalıştır: `npx tsx scripts/build-filter-tree.ts`
// Otomatik: package.json `prebuild` (npm run build öncesi).

import fs from "fs";
import path from "path";

type Entry = {
  make: string;
  model: string;
  engine: string | null;
  kw: number | null;
  ps: number | null;
};

const root = path.join(__dirname, "..");
const src = path.join(root, "mann-filter-data.json");
const dest = path.join(root, "lib", "filter-tree.json");

const data: Entry[] = JSON.parse(fs.readFileSync(src, "utf-8"));

const tree: Record<string, Record<string, string[]>> = {};
for (const e of data) {
  if (!tree[e.make]) tree[e.make] = {};
  if (!tree[e.make][e.model]) tree[e.make][e.model] = [];
  if (e.engine && e.kw && e.ps) {
    const eng = `${e.engine} — ${e.ps} PS / ${e.kw} kW`;
    if (!tree[e.make][e.model].includes(eng)) tree[e.make][e.model].push(eng);
  }
}

const sorted: Record<string, Record<string, string[]>> = {};
for (const make of Object.keys(tree).sort()) {
  sorted[make] = {};
  for (const model of Object.keys(tree[make]).sort()) {
    sorted[make][model] = tree[make][model].sort();
  }
}

fs.writeFileSync(dest, JSON.stringify(sorted));

const sizeKb = (fs.statSync(dest).size / 1024).toFixed(1);
const makeCount = Object.keys(sorted).length;
const modelCount = Object.values(sorted).reduce((a, m) => a + Object.keys(m).length, 0);
const engineCount = Object.values(sorted).reduce(
  (a, m) => a + Object.values(m).reduce((b, e) => b + e.length, 0),
  0
);
console.log(`✓ ${dest} (${sizeKb} KB) — ${makeCount} marka, ${modelCount} model, ${engineCount} motor`);
