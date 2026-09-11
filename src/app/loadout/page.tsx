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
      where: { category: { notIn: ["key"] } },
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
          目标战备下拉 11/18/55/60/78 万，槽位对齐 orzice DIY（枪+配件、头、甲、胸挂、包、手枪、兑换）。允许空槽与部门兑换物。生成配装后看战备 / 花费 / 节省。
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
