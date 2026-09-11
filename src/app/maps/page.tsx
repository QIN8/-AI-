import Link from "next/link";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
  const maps = await prisma.mapInfo.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">MAPS</p>
        <h1 className="mt-1 text-3xl font-bold">地图信息</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          烽火地带主要图：零号大坝、长弓溪谷、巴克什、航天基地、潮汐监狱。门槛数字整理自公开百科与社区攻略，赛季可能调整。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {maps.map((map) => (
          <Link key={map.slug} href={`/maps/${map.slug}`} className="rounded-sm border border-line bg-card p-5 hover:border-gold/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{map.mode} · {map.difficulty}</p>
                <h2 className="mt-1 text-xl font-semibold">{map.name}</h2>
              </div>
              <span className="font-mono text-gold">{formatHaf(map.entryMin)}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">{map.summary}</p>
            <p className="mt-3 text-xs text-gold/80">{map.entryNote}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
