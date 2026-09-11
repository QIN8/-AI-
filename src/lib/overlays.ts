import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { OrziceRow } from "@/lib/orzice";

export type LiveOverlay = { name: string; price: number; note?: string };

export function loadLiveOverlays(): LiveOverlay[] {
  try {
    const file = join(process.cwd(), "prisma/data/live-overlays.json");
    return JSON.parse(readFileSync(file, "utf8")) as LiveOverlay[];
  } catch {
    return [{ name: "AWM狙击步枪", price: 830999, note: "builtin 2026-09-11" }];
  }
}

export function mergeOverlays(...groups: LiveOverlay[][]): LiveOverlay[] {
  const byName = new Map<string, LiveOverlay>();
  for (const group of groups) {
    for (const row of group) {
      if (!row?.name || !Number.isFinite(row.price) || row.price <= 0) continue;
      byName.set(row.name, { name: row.name, price: Math.round(row.price), note: row.note });
    }
  }
  return [...byName.values()];
}

export function applyLiveOverlays(rows: OrziceRow[], overlays = loadLiveOverlays()): OrziceRow[] {
  if (!overlays.length) return rows;
  return rows.map((row) => {
    const hit = overlays.find((o) => row.name === o.name || row.name.startsWith(`${o.name} `));
    if (!hit) return row;
    return { ...row, price: hit.price };
  });
}
