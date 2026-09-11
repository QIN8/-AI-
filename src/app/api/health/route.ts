import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [items, maps] = await Promise.all([prisma.item.count(), prisma.mapInfo.count()]);
    return NextResponse.json({ ok: true, items, maps });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
