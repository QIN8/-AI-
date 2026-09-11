import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [items, maps, awm, bakshiSecret, snapshot] = await Promise.all([
      prisma.item.count(),
      prisma.mapInfo.count(),
      prisma.item.findFirst({ where: { name: { contains: "AWM狙击步枪" } } }),
      prisma.mapInfo.findUnique({ where: { slug: "bakshi-topsecret" } }),
      prisma.priceSnapshot.findUnique({ where: { id: "current" } }),
    ]);
    return NextResponse.json({
      ok: true,
      items,
      maps,
      awmPrice: awm?.buyPrice ?? null,
      bakshiTopSecret: bakshiSecret?.entryMin ?? null,
      priceUpdatedAt: snapshot?.maxGetTime ?? null,
      lastSyncAt: snapshot?.fetchedAt ?? null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
