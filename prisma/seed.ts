import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ORZICE_PRICE_URL, ORZICE_REPO } from "../src/lib/constants";
import { autoFillCheapest } from "../src/lib/loadout";
import { applyLiveOverlays } from "../src/lib/overlays";
import { estimatedSell, inferRarity, mapOrziceCategory, type OrziceRow } from "../src/lib/orzice";
import { MAP_THRESHOLDS, THRESHOLD_SOURCE } from "../src/lib/thresholds";

const prisma = new PrismaClient();

type MapSeed = {
  slug: string;
  groupSlug: string;
  name: string;
  difficulty: string;
  difficultyKey: string;
  entryMin: number;
  entryNote?: string;
  summary: string;
  tips: string;
  featured?: boolean;
  sortOrder?: number;
};

type GuideSeed = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  featured?: boolean;
};

type ForumSeed = {
  title: string;
  nickname: string;
  content: string;
  replies?: { nickname: string; content: string }[];
};

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(__dirname, "data", name), "utf8")) as T;
}

async function main() {
  const rows = applyLiveOverlays(loadJson<OrziceRow[]>("orzice-price.json").filter((r) => r.name && Number(r.price) > 0));
  const maps = loadJson<MapSeed[]>("maps.json").map((map) => ({
    ...map,
    entryMin: MAP_THRESHOLDS[map.slug] ?? map.entryMin,
  }));
  const guides = loadJson<GuideSeed[]>("guides.json");
  const forum = loadJson<ForumSeed[]>("forum.json");

  await prisma.loadoutSlot.deleteMany();
  await prisma.loadout.deleteMany({ where: { source: "seed" } });
  await prisma.item.deleteMany();
  await prisma.mapInfo.deleteMany();
  await prisma.priceSnapshot.deleteMany();

  await prisma.item.createMany({
    data: rows.map((row) => {
      const category = mapOrziceCategory(row.secondClassCN);
      const { rarity, level } = inferRarity(row.name, row.price);
      return {
        slug: `orzice-${row.id}`,
        externalId: row.id,
        name: row.name,
        category,
        subcategory: row.secondClassCN,
        rarity,
        level,
        buyPrice: Math.round(row.price),
        sellPrice: estimatedSell(row.price),
        gearValue: Math.round(row.price),
        fakeAdjust: 1,
        description: `公开行情转储（Orzice DeltaForcePrice），分类「${row.secondClassCN}」。转储无独立战备字段，战备暂按行情价计入。出售价按行情约 72% 估算，非游戏回收公式。`,
        statsJson: JSON.stringify({ 来源分类: row.secondClassCN, 转储编号: String(row.id) }),
        source: "orzice",
        listedAt: row.is_get_time ? new Date(row.is_get_time * 1000) : null,
      };
    }),
  });

  await prisma.priceSnapshot.create({
    data: {
      id: "current",
      source: `Orzice DeltaForcePrice 公开转储 · 含 live-overlays（${THRESHOLD_SOURCE}）`,
      sourceUrl: ORZICE_PRICE_URL,
      itemCount: rows.length,
      maxGetTime: new Date(),
      fetchedAt: new Date(),
    },
  });

  for (const map of maps) {
    await prisma.mapInfo.create({
      data: {
        slug: map.slug,
        groupSlug: map.groupSlug,
        name: map.name,
        difficulty: map.difficulty,
        difficultyKey: map.difficultyKey,
        entryMin: map.entryMin,
        entryNote: map.entryNote ?? "",
        summary: map.summary,
        tips: map.tips,
        featured: map.featured ?? false,
        sortOrder: map.sortOrder ?? 0,
      },
    });
  }

  for (const guide of guides) {
    await prisma.guide.upsert({
      where: { slug: guide.slug },
      update: {
        title: guide.title,
        excerpt: guide.excerpt,
        content: guide.content,
        category: guide.category,
        featured: guide.featured ?? false,
      },
      create: {
        slug: guide.slug,
        title: guide.title,
        excerpt: guide.excerpt,
        content: guide.content,
        category: guide.category,
        featured: guide.featured ?? false,
      },
    });
  }

  const dbItems = await prisma.item.findMany();
  for (const map of maps.filter((m) => m.featured && m.entryMin > 0)) {
    const slots = autoFillCheapest(dbItems, map.entryMin);
    const entries = Object.entries(slots)
      .filter((e): e is [string, string] => Boolean(e[1]))
      .map(([slot, itemId]) => ({ slot, itemId }));
    if (!entries.length) continue;
    await prisma.loadout.create({
      data: {
        name: `${map.name} · ${map.difficulty} 最低买入`,
        budget: map.entryMin,
        mapSlug: map.slug,
        note: `按公开行情自动凑过 ${map.entryMin} 门槛（战备暂按行情计入，可留空槽）。请用交易行核对。`,
        style: "最低买入",
        featured: true,
        source: "seed",
        slots: { create: entries },
      },
    });
  }

  const postCount = await prisma.forumPost.count();
  if (postCount === 0) {
    for (const post of forum) {
      await prisma.forumPost.create({
        data: {
          title: post.title,
          nickname: post.nickname,
          content: post.content,
          replies: {
            create: (post.replies ?? []).map((r) => ({
              nickname: r.nickname,
              content: r.content,
            })),
          },
        },
      });
    }
  }

  await prisma.meta.upsert({
    where: { key: "priceDisclaimer" },
    update: {
      value: `行情来自社区公开转储 ${ORZICE_REPO}，不是腾讯官方 API 或实时交易行保证。战备暂按行情价计入；出售为估算。`,
    },
    create: {
      key: "priceDisclaimer",
      value: `行情来自社区公开转储 ${ORZICE_REPO}，不是腾讯官方 API 或实时交易行保证。战备暂按行情价计入；出售为估算。`,
    },
  });

  const awm = rows.find((r) => r.name === "AWM狙击步枪");
  console.log(
    `Seed OK: ${rows.length} orzice items, AWM=${awm?.price ?? "?"}, bakshi-topsecret=${MAP_THRESHOLDS["bakshi-topsecret"]}, maps=${maps.length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
