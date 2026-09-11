import type { LiveOverlay } from "@/lib/overlays";

const SEARCH_URL = "https://orzice.com/v/zhanbei";
const LIST_PAGES = [
  "https://orzice.com/v/zhanbei",
  "https://orzice.com/v/zhanbei?p=2",
  "https://orzice.com/v/zhanbei?p=3",
  "https://orzice.com/v/ammo",
];

const PINNED_SEARCHES = ["AWM狙击步枪"];

const NAME_PRICE_RE =
  /<div class="item-name">([^<]+)<\/div>[\s\S]{0,1600}?NumJBWJB\(['"]([\d,]+)['"]\)/g;

function parseOrziceHtml(html: string, note: string): LiveOverlay[] {
  const out: LiveOverlay[] = [];
  for (const match of html.matchAll(NAME_PRICE_RE)) {
    const name = match[1].trim();
    const price = Number(match[2].replace(/,/g, ""));
    if (!name || !Number.isFinite(price) || price <= 0) continue;
    out.push({ name, price, note });
  }
  return out;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "delta-ziliao-price-sync/1.0",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.text();
}

/** 只读抓取 orzice 公开 HTML（搜索页 / 列表页里 SSR 的当前价），失败不影响主同步。 */
export async function scrapeOrzicePublicPages(): Promise<LiveOverlay[]> {
  const found: LiveOverlay[] = [];

  for (const name of PINNED_SEARCHES) {
    const url = `${SEARCH_URL}?n=${encodeURIComponent(name)}`;
    try {
      found.push(...parseOrziceHtml(await fetchText(url), `orzice 搜索 ${name}`));
    } catch {
      /* optional */
    }
  }

  for (const url of LIST_PAGES) {
    try {
      found.push(...parseOrziceHtml(await fetchText(url), `orzice ${url}`));
    } catch {
      /* optional */
    }
  }

  const byName = new Map<string, LiveOverlay>();
  for (const row of found) {
    if (!byName.has(row.name)) byName.set(row.name, row);
  }
  return [...byName.values()];
}
