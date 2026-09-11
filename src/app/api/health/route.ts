import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [items, maps, awm, bakshiSecret, bakshiClassified, spaceClassified, snapshot] = await Promise.all([
      prisma.item.count(),
      prisma.mapInfo.count(),
      prisma.item.findFirst({ where: { name: { contains: "AWM狙击步枪" } } }),
      prisma.mapInfo.findUnique({ where: { slug: "bakshi-topsecret" } }),
      prisma.mapInfo.findUnique({ where: { slug: "bakshi-classified" } }),
      prisma.mapInfo.findUnique({ where: { slug: "spacecity-classified" } }),
      prisma.priceSnapshot.findUnique({ where: { id: "current" } }),
    ]);
    return NextResponse.json({
      ok: true,
      items,
      maps,
      awmPrice: awm?.buyPrice ?? null,
      expectedAwm: 830999,
      bakshiTopSecret: bakshiSecret?.entryMin ?? null,
      expectedBakshiTopSecret: 550000,
      bakshiClassified: bakshiClassified?.entryMin ?? null,
      spacecityClassified: spaceClassified?.entryMin ?? null,
      priceUpdatedAt: snapshot?.maxGetTime ?? null,
      lastSyncAt: snapshot?.fetchedAt ?? null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
