import Link from "next/link";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { CATEGORY_LABEL, ITEM_CATEGORIES } from "@/lib/constants";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q = "", category = "gun", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const where = {
    AND: [
      category !== "all" ? { category } : {},
      q
        ? {
            OR: [{ name: { contains: q } }, { slug: { contains: q } }, { subcategory: { contains: q } }],
          }
        : {},
    ],
  };
  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: [{ buyPrice: "desc" }],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">MARKET DUMP</p>
        <h1 className="mt-1 text-3xl font-bold">装备与物价</h1>
        <p className="mt-2 text-sm text-muted">GitHub 转储为底，orzice 公开页与 live-overlays 覆盖。AWM 应约为 83 万（830999），不是约 10 万的旧示例。</p>
      </div>
      <DisclaimerBanner />
      <form className="grid gap-3 rounded-sm border border-line bg-card p-4 md:grid-cols-[1fr_auto]" action="/items">
        <input name="q" defaultValue={q} placeholder="搜索 AWM、头盔、5.56…" className="rounded-sm border border-line bg-elev px-3 py-2 text-sm" />
        <button className="rounded-sm bg-gold px-4 py-2 text-sm font-semibold text-[#1a1406]" type="submit">
          搜索
        </button>
        <input type="hidden" name="category" value={category} />
      </form>
      <div className="flex flex-wrap gap-2">
        {ITEM_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/items?category=${c.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-sm border px-3 py-1.5 text-sm ${
              category === c.id ? "border-gold bg-gold/15 text-gold" : "border-line hover:border-gold/40"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">
        共 {total} 件 · 第 {pageNum}/{pages} 页
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const spread = item.buyPrice - item.sellPrice;
          const stats = JSON.parse(item.statsJson || "{}") as { 涨跌比?: string };
          const change = Number(stats.涨跌比);
          return (
            <Link key={item.id} href={`/items/${item.slug}`} className="card-lift rounded-sm border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-snug">{item.name}</h2>
                <ItemBadge rarity={item.rarity} level={item.level} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {CATEGORY_LABEL[item.category] ?? item.category}
                {item.subcategory ? ` · ${item.subcategory}` : ""}
              </p>
              <p className="mt-3 font-mono text-xl text-gold">{formatHaf(item.buyPrice)}</p>
              <p className="mt-1 text-xs text-muted">
                估售 {formatHaf(item.sellPrice)} · 买卖差 {formatHaf(spread)}
                {Number.isFinite(change)
                  ? ` · 涨跌 ${change > 0 ? "+" : ""}${change}`
                  : ""}
              </p>
            </Link>
          );
        })}
      </div>
      {pages > 1 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .slice(Math.max(0, pageNum - 4), pageNum + 3)
            .map((n) => (
              <Link
                key={n}
                href={`/items?category=${category}&page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-sm border px-3 py-1 text-sm ${n === pageNum ? "border-gold text-gold" : "border-line"}`}
              >
                {n}
              </Link>
            ))}
        </div>
      ) : null}
    </div>
  );
}
