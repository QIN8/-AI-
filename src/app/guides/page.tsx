import Link from "next/link";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">GUIDES</p>
        <h1 className="mt-1 text-3xl font-bold">攻略与帮助</h1>
        <p className="mt-2 text-sm text-muted">卡战备、地图路线与站务说明。内容依据公开资料编写，非官方攻略。</p>
      </div>
      <div className="grid gap-3">
        {guides.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="rounded-sm border border-line bg-card p-5 hover:border-gold/40">
            <p className="text-xs text-gold">
              {g.category} · {formatDate(g.publishedAt)}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{g.title}</h2>
            <p className="mt-2 text-sm text-muted">{g.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
