import { LoadoutPlanner } from "@/components/LoadoutPlanner";
import { prisma } from "@/lib/prisma";
import type { KitSlots } from "@/lib/loadout";

export const dynamic = "force-dynamic";

export default async function LoadoutPage({
  searchParams,
}: {
  searchParams: Promise<{ budget?: string; kit?: string }>;
}) {
  const params = await searchParams;
  const [items, maps, featured, selected] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { gearValue: "desc" }] }),
    prisma.mapInfo.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.loadout.findMany({
      where: { featured: true },
      include: { slots: true },
      orderBy: { budget: "asc" },
    }),
    params.kit
      ? prisma.loadout.findUnique({ where: { id: params.kit }, include: { slots: true } })
      : Promise.resolve(null),
  ]);

  const initialBudget = params.budget ? Number(params.budget) : selected?.budget;
  const initialKit = selected
    ? (Object.fromEntries(selected.slots.map((s) => [s.slot, s.itemId])) as KitSlots)
    : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">LOADOUT</p>
        <h1 className="mt-1 text-3xl font-bold">卡战备计算器</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          按地图门槛组装头甲包挂与枪械配件，同时看买入、出售、标准战备和假账战备。可保存 3 套本地方案并对照推荐套。自动凑档用「战备/买价」贪心，结果仅供演示。
        </p>
      </div>
      <LoadoutPlanner
        items={items}
        maps={maps}
        featured={featured.map((k) => ({
          id: k.id,
          name: k.name,
          budget: k.budget,
          mapSlug: k.mapSlug,
          note: k.note,
          style: k.style,
          slots: Object.fromEntries(k.slots.map((s) => [s.slot, s.itemId])),
        }))}
        initialBudget={Number.isFinite(initialBudget) ? initialBudget : undefined}
        initialKit={initialKit}
      />
    </div>
  );
}
