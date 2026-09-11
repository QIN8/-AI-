import { LoadoutPlanner } from "@/components/LoadoutPlanner";
import type { KitSlots } from "@/lib/loadout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoadoutPage({
  searchParams,
}: {
  searchParams: Promise<{ map?: string; kit?: string }>;
}) {
  const params = await searchParams;
  const [items, maps, featured, selected] = await Promise.all([
    prisma.item.findMany({
      where: { category: { notIn: ["loot"] } },
      orderBy: [{ category: "asc" }, { buyPrice: "asc" }],
    }),
    prisma.mapInfo.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.loadout.findMany({
      where: { featured: true },
      include: { slots: true },
      orderBy: { budget: "asc" },
    }),
    params.kit ? prisma.loadout.findUnique({ where: { id: params.kit }, include: { slots: true } }) : Promise.resolve(null),
  ]);

  const initialKit = selected ? (Object.fromEntries(selected.slots.map((s) => [s.slot, s.itemId])) as KitSlots) : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">DIY LOADOUT</p>
        <h1 className="mt-1 text-3xl font-bold">卡战备 · 自己凑档</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          先选地图和难度（机密 / 绝密分开），再从公开行情库往槽位里塞装备。实时看买入、估算出售、战备（按行情计入）和距门槛差额。一键「最低买入凑档」或保存 3 套本地方案。
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
        initialMapSlug={params.map ?? selected?.mapSlug}
        initialKit={initialKit}
      />
    </div>
  );
}
