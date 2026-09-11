import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Stat } from "@/components/Stat";
import { formatHaf } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const map = await prisma.mapInfo.findUnique({ where: { slug } });
  if (!map) notFound();
  const related = await prisma.loadout.findMany({
    where: { mapSlug: slug },
    orderBy: { budget: "asc" },
  });

  return (
    <div className="grid gap-6">
      <Link href="/maps" className="text-sm text-gold hover:underline">
        ← 全部地图
      </Link>
      <div className="rounded-sm border border-line bg-card p-6">
        <p className="text-xs text-muted">{map.mode}</p>
        <h1 className="mt-1 text-3xl font-bold">{map.name}</h1>
        <p className="mt-2 text-sm text-muted">{map.difficulty}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="社区整理入场线" value={formatHaf(map.entryMin)} tone="gold" />
          <Stat label="模式" value={map.mode} />
          <Stat label="难度" value={map.difficulty.split("/")[0]?.trim() ?? map.difficulty} />
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
    </div>
  );
}
