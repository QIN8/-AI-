import Link from "next/link";
import { OfficialMapPanel } from "@/components/OfficialMapPanel";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
  const maps = await prisma.mapInfo.findMany({ orderBy: { sortOrder: "asc" } });
  const groups = new Map<string, typeof maps>();
  for (const map of maps) {
    const list = groups.get(map.groupSlug) ?? [];
    list.push(map);
    groups.set(map.groupSlug, list);
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">MAPS</p>
        <h1 className="mt-1 text-3xl font-bold">地图与入场门槛</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          每一张图的普通 / 机密 / 绝密 / 永夜都是独立记录。巴克什机密 18.75 万，绝密 58 万，不要合成一个数。
        </p>
      </div>

      {[...groups.values()].map((list) => (
        <section key={list[0].groupSlug} className="grid gap-3">
          <h2 className="text-xl font-semibold">{list[0].name}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((map) => (
              <Link key={map.slug} href={`/maps/${map.slug}`} className="card-lift rounded-sm border border-line bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gold">{map.difficulty}</p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {map.name} · {map.difficulty}
                    </h3>
                  </div>
                  <span className="font-mono text-gold">{map.entryMin > 0 ? formatHaf(map.entryMin) : "无数字门槛"}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">{map.summary}</p>
                <p className="mt-3 text-xs text-gold/80">{map.entryNote}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <OfficialMapPanel />
    </div>
  );
}
