import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ORZICE_PRICE_URL } from "@/lib/constants";
import { estimatedSell, inferRarity, mapOrziceCategory, type OrziceRow } from "@/lib/orzice";
import { prisma } from "@/lib/prisma";
import { getPriceSnapshot, type SnapshotDTO } from "@/lib/snapshot";

const DEFAULT_TTL_MS = 8 * 60 * 1000;
const WORK_API_DEFAULT = "https://orzice.com/workApi/v1/sjz_api/item_price_all";

type SyncResult = {
  ok: boolean;
  didRefresh: boolean;
  stale: boolean;
  snapshot: SnapshotDTO;
  sourceTried: string[];
  error?: string;
};

let inflight: Promise<SyncResult> | null = null;

function ttlMs() {
  const raw = Number(process.env.PRICE_SYNC_TTL_MS ?? DEFAULT_TTL_MS);
  return Number.isFinite(raw) && raw >= 30_000 ? raw : DEFAULT_TTL_MS;
}

function asRows(payload: unknown): OrziceRow[] {
  const bag = payload as { data?: unknown };
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(bag?.data)
      ? bag.data
      : Array.isArray((bag?.data as { list?: unknown })?.list)
        ? (bag.data as { list: unknown[] }).list
        : [];

  const rows: OrziceRow[] = [];
  for (const raw of list) {
    const row = raw as Record<string, unknown>;
    const id = Number(row.id ?? row.tid);
    const name = String(row.name ?? "").trim();
    const price = Number(row.price);
    if (!name || !Number.isFinite(price) || price <= 0) continue;
    rows.push({
      id: Number.isFinite(id) ? id : rows.length + 1,
      name,
      price,
      secondClassCN: String(row.secondClassCN ?? row.class ?? row.type ?? "其他"),
      is_get_time: Number(row.is_get_time ?? row.time ?? 0),
      zbPrice: Number(row.zb_price ?? row.zbPrice),
      changeRatio: Number(row.bl ?? row.change),
    });
  }
  return rows;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "delta-ziliao-price-sync/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

async function loadLocalDump(): Promise<OrziceRow[]> {
  const file = join(process.cwd(), "prisma/data/orzice-price.json");
  return asRows(JSON.parse(readFileSync(file, "utf8")));
}

async function collectRows(): Promise<{ rows: OrziceRow[]; source: string; sourceUrl: string; tried: string[] }> {
  const tried: string[] = [];
  const token = process.env.ORZICE_TOKEN?.trim();
  const workBase = process.env.ORZICE_WORK_API_URL?.trim() || WORK_API_DEFAULT;

  if (token) {
    const url = `${workBase}?isZb=0&token=${encodeURIComponent(token)}`;
    tried.push("work-api");
    try {
      const rows = asRows(await fetchJson(url));
      if (rows.length) {
        return { rows, source: "社区公开数据源 / Orzice 风格工作台接口（可选 token）", sourceUrl: workBase, tried };
      }
    } catch {
      /* fall through — tokenized API is optional */
    }
  } else {
    tried.push("work-api:skipped-no-token");
  }

  tried.push("github-dump");
  try {
    const rows = asRows(await fetchJson(ORZICE_PRICE_URL));
    if (rows.length) {
      return {
        rows,
        source: "社区公开数据源 / Orzice 风格公开转储",
        sourceUrl: ORZICE_PRICE_URL,
        tried,
      };
    }
  } catch {
    /* local file next */
  }

  tried.push("local-seed");
  const rows = await loadLocalDump();
  if (!rows.length) throw new Error("所有物价源都不可用");
  return {
    rows,
    source: "本地打包转储（Orzice 风格，离线回退）",
    sourceUrl: "prisma/data/orzice-price.json",
    tried,
  };
}

async function persistRows(rows: OrziceRow[], source: string, sourceUrl: string) {
  const times = rows.map((r) => r.is_get_time).filter((t) => t > 0);
  const maxGet = times.length ? Math.max(...times) : Math.floor(Date.now() / 1000);

  for (let i = 0; i < rows.length; i += 80) {
    const chunk = rows.slice(i, i + 80);
    await prisma.$transaction(
      chunk.map((row) => {
        const category = mapOrziceCategory(row.secondClassCN);
        const { rarity, level } = inferRarity(row.name, row.price);
        const gearValue = Number.isFinite(row.zbPrice) && (row.zbPrice as number) > 0 ? Math.round(row.zbPrice as number) : Math.round(row.price);
        const stats: Record<string, string> = {
          来源分类: row.secondClassCN,
          转储编号: String(row.id),
        };
        if (Number.isFinite(row.changeRatio)) stats.涨跌比 = String(row.changeRatio);
        return prisma.item.upsert({
          where: { slug: `orzice-${row.id}` },
          update: {
            name: row.name,
            category,
            subcategory: row.secondClassCN,
            rarity,
            level,
            buyPrice: Math.round(row.price),
            sellPrice: estimatedSell(row.price),
            gearValue,
            listedAt: row.is_get_time ? new Date(row.is_get_time * 1000) : null,
            source: "orzice",
            statsJson: JSON.stringify(stats),
            description: `社区公开数据源 / Orzice 风格公开数据。分类「${row.secondClassCN}」。战备${Number.isFinite(row.zbPrice) && (row.zbPrice as number) > 0 ? "取转储 zb_price" : "暂按行情价计入"}。出售按行情约 72% 估算。`,
          },
          create: {
            slug: `orzice-${row.id}`,
            externalId: row.id,
            name: row.name,
            category,
            subcategory: row.secondClassCN,
            rarity,
            level,
            buyPrice: Math.round(row.price),
            sellPrice: estimatedSell(row.price),
            gearValue,
            fakeAdjust: 1,
            listedAt: row.is_get_time ? new Date(row.is_get_time * 1000) : null,
            source: "orzice",
            statsJson: JSON.stringify(stats),
            description: `社区公开数据源 / Orzice 风格公开数据。分类「${row.secondClassCN}」。`,
          },
        });
      }),
    );
  }

  await prisma.priceSnapshot.upsert({
    where: { id: "current" },
    update: {
      source,
      sourceUrl,
      itemCount: rows.length,
      maxGetTime: new Date(maxGet * 1000),
      fetchedAt: new Date(),
    },
    create: {
      id: "current",
      source,
      sourceUrl,
      itemCount: rows.length,
      maxGetTime: new Date(maxGet * 1000),
      fetchedAt: new Date(),
    },
  });
}

function isStale(snapshot: SnapshotDTO) {
  if (!snapshot) return true;
  return Date.now() - new Date(snapshot.fetchedAt).getTime() > ttlMs();
}

export async function refreshPrices(): Promise<SyncResult> {
  const tried: string[] = [];
  try {
    const collected = await collectRows();
    tried.push(...collected.tried);
    await persistRows(collected.rows, collected.source, collected.sourceUrl);
    return {
      ok: true,
      didRefresh: true,
      stale: false,
      snapshot: await getPriceSnapshot(),
      sourceTried: tried,
    };
  } catch (error) {
    return {
      ok: false,
      didRefresh: false,
      stale: true,
      snapshot: await getPriceSnapshot(),
      sourceTried: tried,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function ensureFreshPrices(opts?: { wait?: boolean; force?: boolean }): Promise<SyncResult> {
  const snapshot = await getPriceSnapshot();
  const stale = opts?.force || isStale(snapshot);
  if (!stale) {
    return { ok: true, didRefresh: false, stale: false, snapshot, sourceTried: [] };
  }

  if (inflight) {
    if (opts?.wait === false) {
      return { ok: true, didRefresh: false, stale: true, snapshot, sourceTried: ["in-flight"] };
    }
    return inflight;
  }

  inflight = refreshPrices().finally(() => {
    inflight = null;
  });

  if (opts?.wait === false) {
    return { ok: true, didRefresh: false, stale: true, snapshot, sourceTried: ["scheduled"] };
  }
  return inflight;
}
