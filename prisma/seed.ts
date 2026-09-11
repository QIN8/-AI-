import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

type ItemSeed = {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  rarity: string;
  level?: number;
  buyPrice: number;
  sellPrice: number;
  gearValue: number;
  fakeAdjust?: number;
  weight?: number;
  description?: string;
  stats?: Record<string, string>;
};

type MapSeed = {
  slug: string;
  name: string;
  mode?: string;
  difficulty: string;
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

type LoadoutSeed = {
  name: string;
  budget: number;
  mapSlug?: string;
  style?: string;
  note?: string;
  featured?: boolean;
  items: string[];
};

type ForumSeed = {
  title: string;
  nickname: string;
  content: string;
  replies?: { nickname: string; content: string }[];
};

function loadJson<T>(name: string): T {
  const file = join(__dirname, "data", name);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function slotForCategory(category: string, used: Record<string, number>): string {
  const count = used[category] ?? 0;
  used[category] = count + 1;
  if (category === "gun") return count === 0 ? "primary" : "secondary";
  if (category === "helmet") return "helmet";
  if (category === "armor") return "armor";
  if (category === "bag") return "bag";
  if (category === "chest_rig") return "chest";
  if (category === "med") return count === 0 ? "med1" : "med2";
  return `extra-${count + 1}`;
}

async function main() {
  const items = loadJson<ItemSeed[]>("items.json");
  const maps = loadJson<MapSeed[]>("maps.json");
  const guides = loadJson<GuideSeed[]>("guides.json");
  const loadouts = loadJson<LoadoutSeed[]>("loadouts.json");
  const forum = loadJson<ForumSeed[]>("forum.json");

  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        category: item.category,
        subcategory: item.subcategory ?? "",
        rarity: item.rarity,
        level: item.level ?? 1,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        gearValue: item.gearValue,
        fakeAdjust: item.fakeAdjust ?? 1,
        weight: item.weight ?? 0,
        description: item.description ?? "",
        statsJson: JSON.stringify(item.stats ?? {}),
      },
      create: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory ?? "",
        rarity: item.rarity,
        level: item.level ?? 1,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        gearValue: item.gearValue,
        fakeAdjust: item.fakeAdjust ?? 1,
        weight: item.weight ?? 0,
        description: item.description ?? "",
        statsJson: JSON.stringify(item.stats ?? {}),
      },
    });
  }

  for (const map of maps) {
    await prisma.mapInfo.upsert({
      where: { slug: map.slug },
      update: {
        name: map.name,
        mode: map.mode ?? "烽火地带",
        difficulty: map.difficulty,
        entryMin: map.entryMin,
        entryNote: map.entryNote ?? "",
        summary: map.summary,
        tips: map.tips,
        featured: map.featured ?? false,
        sortOrder: map.sortOrder ?? 0,
      },
      create: {
        slug: map.slug,
        name: map.name,
        mode: map.mode ?? "烽火地带",
        difficulty: map.difficulty,
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
  const bySlug = new Map(dbItems.map((i) => [i.slug, i]));

  for (const kit of loadouts) {
    const existing = await prisma.loadout.findFirst({
      where: { name: kit.name, source: "seed" },
    });
    if (existing) {
      await prisma.loadoutSlot.deleteMany({ where: { loadoutId: existing.id } });
      await prisma.loadout.delete({ where: { id: existing.id } });
    }

    const used: Record<string, number> = {};
    const slots = kit.items
      .map((slug) => {
        const item = bySlug.get(slug);
        if (!item) return null;
        return { slot: slotForCategory(item.category, used), itemId: item.id };
      })
      .filter((s): s is { slot: string; itemId: string } => Boolean(s));

    await prisma.loadout.create({
      data: {
        name: kit.name,
        budget: kit.budget,
        mapSlug: kit.mapSlug ?? "",
        note: kit.note ?? "",
        style: kit.style ?? "均衡",
        featured: kit.featured ?? false,
        source: "seed",
        slots: { create: slots },
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
      value:
        "装备买入价、出售价与战备价值均为社区风格示例快照，仅供功能演示，不是官方实时交易行，也未声称接入官方 API。赛季与热补丁后请以游戏内为准。",
    },
    create: {
      key: "priceDisclaimer",
      value:
        "装备买入价、出售价与战备价值均为社区风格示例快照，仅供功能演示，不是官方实时交易行，也未声称接入官方 API。赛季与热补丁后请以游戏内为准。",
    },
  });

  await prisma.meta.upsert({
    where: { key: "seededAt" },
    update: { value: new Date().toISOString() },
    create: { key: "seededAt", value: new Date().toISOString() },
  });

  console.log(
    `Seed OK: ${items.length} items, ${maps.length} maps, ${guides.length} guides, ${loadouts.length} loadouts`,
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
