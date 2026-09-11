import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { OfficialMapPanel } from "@/components/OfficialMapPanel";
import { Stat } from "@/components/Stat";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const map = await prisma.mapInfo.findUnique({ where: { slug } });
  if (!map) notFound();
  const [related, siblings] = await Promise.all([
    prisma.loadout.findMany({ where: { mapSlug: slug }, orderBy: { budget: "asc" } }),
    prisma.mapInfo.findMany({ where: { groupSlug: map.groupSlug }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <Link href="/maps" className="text-sm text-gold hover:underline">
        ← 全部地图
      </Link>
      <div className="rounded-sm border border-line bg-card p-6">
        <p className="text-xs text-muted">{map.mode}</p>
        <h1 className="mt-1 text-3xl font-bold">
          {map.name} · {map.difficulty}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              href={`/maps/${s.slug}`}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                s.slug === map.slug ? "border-gold bg-gold/15 text-gold" : "border-line hover:border-gold/40"
              }`}
            >
              {s.difficulty} · {s.entryMin > 0 ? formatHaf(s.entryMin) : "无数字门槛"}
            </Link>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="本难度入场线" value={map.entryMin > 0 ? formatHaf(map.entryMin) : "无数字门槛"} tone="gold" />
          <Stat label="模式" value={map.mode} />
          <Stat label="难度（单独记录）" value={map.difficulty} />
        </div>
        <p className="mt-5 text-sm leading-7 text-sand/80">{map.summary}</p>
        <p className="mt-3 rounded-sm border border-gold/20 bg-gold/8 p-3 text-sm leading-7 text-sand/80">{map.entryNote}</p>
        <div className="prose-delta mt-6">
          <ReactMarkdown>{map.tips}</ReactMarkdown>
        </div>
        {related.length ? (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gold">相关推荐套</h2>
            <div className="mt-3 grid gap-2">
              {related.map((k) => (
                <Link key={k.id} href={`/loadout?kit=${k.id}`} className="rounded-sm border border-line bg-elev px-3 py-2 text-sm hover:border-gold/40">
                  {k.name} · {formatHaf(k.budget)} · {k.style}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <OfficialMapPanel />
    </div>
  );
}
