import Link from "next/link";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { CATEGORY_LABEL, ITEM_CATEGORIES } from "@/lib/constants";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "all" } = await searchParams;
  const items = await prisma.item.findMany({
    where: {
      AND: [
        category !== "all" ? { category } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { slug: { contains: q } },
                { subcategory: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ category: "asc" }, { gearValue: "desc" }],
  });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">ARSENAL</p>
        <h1 className="mt-1 text-3xl font-bold">装备与物价</h1>
        <p className="mt-2 text-sm text-muted">可检索枪械、头盔、护甲、背包、胸挂、医疗与配件。价格为示例快照。</p>
      </div>
      <DisclaimerBanner />
      <form className="grid gap-3 rounded-sm border border-line bg-card p-4 md:grid-cols-[1fr_auto]" action="/items">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索名称、英文短码或描述…"
          className="rounded-sm border border-line bg-elev px-3 py-2 text-sm"
        />
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
      <p className="text-xs text-muted">共 {items.length} 件</p>
      <div className="overflow-x-auto rounded-sm border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-elev text-xs text-gold">
            <tr>
              <th className="px-3 py-2">装备</th>
              <th className="px-3 py-2">分类</th>
              <th className="px-3 py-2">买入</th>
              <th className="px-3 py-2">出售</th>
              <th className="px-3 py-2">战备</th>
              <th className="px-3 py-2">假账系数</th>
              <th className="px-3 py-2">性价</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line hover:bg-white/5">
                <td className="px-3 py-2">
                  <Link href={`/items/${item.slug}`} className="font-medium hover:text-gold">
                    {item.name}
                  </Link>
                  <div className="mt-1">
                    <ItemBadge rarity={item.rarity} level={item.level} />
                  </div>
                </td>
                <td className="px-3 py-2 text-muted">
                  {CATEGORY_LABEL[item.category]}
                  {item.subcategory ? ` · ${item.subcategory}` : ""}
                </td>
                <td className="px-3 py-2 font-mono">{formatHaf(item.buyPrice)}</td>
                <td className="px-3 py-2 font-mono">{formatHaf(item.sellPrice)}</td>
                <td className="px-3 py-2 font-mono text-gold">{formatHaf(item.gearValue)}</td>
                <td className="px-3 py-2 font-mono">{item.fakeAdjust.toFixed(2)}</td>
                <td className="px-3 py-2 font-mono text-olive">
                  {item.buyPrice ? (item.gearValue / item.buyPrice).toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
