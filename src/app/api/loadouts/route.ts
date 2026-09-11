import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { kitToEntries, type KitSlots } from "@/lib/loadout";
import { prisma } from "@/lib/prisma";
import { asInt, cleanText } from "@/lib/validate";

export async function GET() {
  const loadouts = await prisma.loadout.findMany({
    include: { slots: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ loadouts });
}

export async function POST(request: Request) {
  if (!rateLimit(`loadout:${clientKey(request.headers)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "保存太频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      budget?: unknown;
      mapSlug?: unknown;
      note?: unknown;
      style?: unknown;
      slots?: KitSlots;
    };
    const name = cleanText(body.name, 2, 40, "名称");
    const budget = asInt(body.budget, "档位");
    const mapSlug = typeof body.mapSlug === "string" ? body.mapSlug.slice(0, 40) : "";
    const note = typeof body.note === "string" ? body.note.slice(0, 200) : "";
    const style = typeof body.style === "string" ? body.style.slice(0, 20) : "自定义";
    const entries = kitToEntries(body.slots ?? {});
    if (entries.length === 0) {
      return NextResponse.json({ error: "至少选择一件装备" }, { status: 400 });
    }

    const ids = entries.map((e) => e.itemId);
    const found = await prisma.item.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      return NextResponse.json({ error: "包含未知装备" }, { status: 400 });
    }

    const loadout = await prisma.loadout.create({
      data: {
        name,
        budget,
        mapSlug,
        note,
        style,
        featured: false,
        source: "user",
        slots: { create: entries },
      },
    });
    return NextResponse.json({ ok: true, id: loadout.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
