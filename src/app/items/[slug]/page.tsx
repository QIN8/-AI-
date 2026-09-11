import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemBadge } from "@/components/ItemBadge";
import { Stat } from "@/components/Stat";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatDate, formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.item.findUnique({ where: { slug } });
  if (!item) notFound();
  const stats = JSON.parse(item.statsJson || "{}") as Record<string, string>;

  return (
    <div className="grid gap-6">
      <Link href="/items" className="text-sm text-gold hover:underline">
        ← 返回目录
      </Link>
      <div className="rounded-sm border border-line bg-card p-6">
        <p className="text-xs text-muted">
          {CATEGORY_LABEL[item.category] ?? item.category}
          {item.subcategory ? ` · ${item.subcategory}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{item.name}</h1>
        <div className="mt-3">
          <ItemBadge rarity={item.rarity} level={item.level} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{item.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="公开行情（买入参考）" value={formatHaf(item.buyPrice)} tone="gold" />
          <Stat label="估算出售" value={formatHaf(item.sellPrice)} hint="约行情 72%，非官方回收" />
          <Stat label="战备（暂按行情）" value={formatHaf(item.gearValue)} />
          <Stat label="买卖差" value={formatHaf(item.buyPrice - item.sellPrice)} />
        </div>
        <p className="mt-4 text-sm text-muted">
          来源 {item.source}
          {item.listedAt ? ` · 转储采集 ${formatDate(item.listedAt)}` : ""}
          {item.externalId != null ? ` · 编号 ${item.externalId}` : ""}
        </p>
        {Object.keys(stats).length ? (
          <dl className="mt-6 grid gap-2 sm:grid-cols-2">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="rounded-sm border border-line bg-elev px-3 py-2">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <Link href="/loadout" className="mt-6 inline-block text-sm text-gold hover:underline">
          去 DIY 卡战备选用
        </Link>
      </div>
    </div>
  );
}
