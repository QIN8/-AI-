import Link from "next/link";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { BUDGET_TIERS, CATEGORY_LABEL, SITE_NAME } from "@/lib/constants";
import { formatDate, formatHaf } from "@/lib/format";
import { summarizeKit } from "@/lib/loadout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [maps, guides, posts, loadouts, itemCount] = await Promise.all([
    prisma.mapInfo.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.guide.findMany({ orderBy: { publishedAt: "desc" }, take: 4 }),
    prisma.forumPost.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { _count: { select: { replies: true } } } }),
    prisma.loadout.findMany({
      where: { featured: true },
      include: { slots: { include: { item: true } } },
      orderBy: { budget: "asc" },
      take: 3,
    }),
    prisma.item.count(),
  ]);

  return (
    <div className="grid gap-10">
      <section className="overflow-hidden rounded-sm border border-line bg-card">
        <div className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-10">
          <div>
            <p className="text-xs tracking-[0.25em] text-gold">DELTA FORCE · UNOFFICIAL</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              {SITE_NAME}
              <span className="block text-xl font-medium text-sand/70 md:text-2xl">烽火地带卡战备与公开资料</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
              按 11.25 / 18.75 / 55 / 60 / 78 万档位凑装，对比买入、出售与战备（含假账系数演示）。装备目录可检索，地图页写明入场门槛，攻略与匿名论坛帮你少送一次包。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/loadout" className="rounded-sm bg-gold px-4 py-2 text-sm font-semibold text-[#1a1406] hover:bg-[#e0b32a]">
                打开卡战备
              </Link>
              <Link href="/items" className="rounded-sm border border-line px-4 py-2 text-sm hover:border-gold/50">
                浏览装备
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {[
              ["装备样本", `${itemCount} 件`],
              ["地图", `${maps.length} 张`],
              ["档位", "5 档门槛"],
              ["攻略", `${guides.length}+ 篇`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-sm border border-line bg-elev p-3">
                <p className="text-[11px] text-muted">{k}</p>
                <p className="mt-1 font-mono text-xl text-gold">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-line px-6 py-3 md:px-10">
          <DisclaimerBanner />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">推荐配装</h2>
          <Link href="/loadout" className="text-sm text-gold hover:underline">
            自己凑一套
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {loadouts.map((kit) => {
            const slots = Object.fromEntries(kit.slots.map((s) => [s.slot, s.itemId]));
            const totals = summarizeKit(slots, kit.slots.map((s) => s.item), false);
            return (
              <Link
                key={kit.id}
                href={`/loadout?kit=${kit.id}`}
                className="grid gap-3 rounded-sm border border-line bg-card p-4 hover:border-gold/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gold">{kit.style} · {formatHaf(kit.budget)}</p>
                    <h3 className="mt-1 font-semibold">{kit.name}</h3>
                  </div>
                  <span className="font-mono text-sm text-olive">{formatHaf(totals.gear)}</span>
                </div>
                <p className="text-xs leading-6 text-muted">{kit.note}</p>
                <ul className="grid gap-1.5 text-sm">
                  {kit.slots.slice(0, 4).map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <span>{s.item.name}</span>
                      <ItemBadge rarity={s.item.rarity} level={s.item.level} />
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">地图门槛</h2>
          <Link href="/maps" className="text-sm text-gold hover:underline">
            全部地图
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {maps.map((map) => (
            <Link key={map.slug} href={`/maps/${map.slug}`} className="rounded-sm border border-line bg-card p-4 hover:border-gold/40">
              <p className="text-[11px] text-muted">{map.difficulty}</p>
              <h3 className="mt-1 font-semibold">{map.name}</h3>
              <p className="mt-2 font-mono text-gold">{formatHaf(map.entryMin)}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{map.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">最新攻略</h2>
            <Link href="/guides" className="text-sm text-gold hover:underline">
              全部
            </Link>
          </div>
          <div className="grid gap-3">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="rounded-sm border border-line bg-card p-4 hover:border-gold/40">
                <p className="text-[11px] text-gold">{g.category}</p>
                <h3 className="mt-1 font-medium">{g.title}</h3>
                <p className="mt-1 text-sm text-muted">{g.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">论坛新帖</h2>
            <Link href="/forum" className="text-sm text-gold hover:underline">
              进入论坛
            </Link>
          </div>
          <div className="grid gap-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/forum/${p.id}`} className="rounded-sm border border-line bg-card p-4 hover:border-gold/40">
                <h3 className="font-medium">{p.title}</h3>
                <p className="mt-1 text-xs text-muted">
                  {p.nickname} · {formatDate(p.createdAt)} · {p._count.replies} 条回复
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-line bg-elev p-5">
        <h2 className="text-lg font-semibold">档位速查</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {BUDGET_TIERS.map((t) => (
            <Link key={t.id} href={`/loadout?budget=${t.budget}`} className="rounded-sm border border-line bg-card p-3 hover:border-gold/40">
              <p className="font-mono text-gold">{t.label}</p>
              <p className="mt-1 text-xs text-muted">{t.maps}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          装备分类覆盖{Object.values(CATEGORY_LABEL).join("、")}。演示数据可替换，不抓取第三方实时站。
        </p>
      </section>
    </div>
  );
}
