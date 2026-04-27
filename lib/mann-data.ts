import path from "path";
import fs from "fs";

export type Entry = {
  make: string;
  model: string;
  engine: string | null;
  kw: number | null;
  ps: number | null;
  year_of_prod: string | null;
  air: string | string[] | null;
  oil: string | string[] | null;
  fuel: string | string[] | null;
  cabin: string | string[] | null;
};

export const norm = (c: string) => c.replace(/\s+/g, "").toUpperCase();

export const toArray = (v: string | string[] | null | undefined): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

let _data: Entry[] | null = null;
let _byCode: Map<string, Entry[]> | null = null;

function load(): void {
  if (_data && _byCode) return;

  const p = path.join(process.cwd(), "mann-filter-data.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as Entry[];

  const idx = new Map<string, Set<Entry>>();
  for (const e of data) {
    for (const c of [...toArray(e.air), ...toArray(e.oil), ...toArray(e.fuel), ...toArray(e.cabin)]) {
      const key = norm(c);
      let set = idx.get(key);
      if (!set) {
        set = new Set();
        idx.set(key, set);
      }
      set.add(e);
    }
  }

  const byCode = new Map<string, Entry[]>();
  for (const [k, set] of idx) byCode.set(k, [...set]);

  _data = data;
  _byCode = byCode;
}

export function getMannData(): Entry[] {
  load();
  return _data!;
}

export function getCompatibleVehicles(mannCode: string): Entry[] {
  load();
  return _byCode!.get(norm(mannCode)) ?? [];
}
