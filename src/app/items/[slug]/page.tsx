import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemBadge } from "@/components/ItemBadge";
import { Stat } from "@/components/Stat";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatHaf, formatKg } from "@/lib/format";
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
          {CATEGORY_LABEL[item.category]}
          {item.subcategory ? ` · ${item.subcategory}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{item.name}</h1>
        <div className="mt-3">
          <ItemBadge rarity={item.rarity} level={item.level} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{item.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="买入价（示例）" value={formatHaf(item.buyPrice)} />
          <Stat label="出售价（示例）" value={formatHaf(item.sellPrice)} />
          <Stat label="战备价值" value={formatHaf(item.gearValue)} tone="gold" />
          <Stat
            label="假账战备"
            value={formatHaf(Math.round(item.gearValue * item.fakeAdjust))}
            hint={`系数 ${item.fakeAdjust.toFixed(2)}`}
          />
        </div>
        <p className="mt-4 text-sm text-muted">重量示意 {formatKg(item.weight)} · 短码 {item.slug}</p>
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
        <Link href={`/loadout`} className="mt-6 inline-block text-sm text-gold hover:underline">
          去卡战备里选用这件
        </Link>
      </div>
    </div>
  );
}
