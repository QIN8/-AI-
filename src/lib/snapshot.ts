import { prisma } from "@/lib/prisma";

export type SnapshotDTO = {
  source: string;
  sourceUrl: string;
  itemCount: number;
  maxGetTime: string;
  fetchedAt: string;
} | null;

export async function getPriceSnapshot(): Promise<SnapshotDTO> {
  try {
    const snap = await prisma.priceSnapshot.findUnique({ where: { id: "current" } });
    if (!snap) return null;
    return {
      source: snap.source,
      sourceUrl: snap.sourceUrl,
      itemCount: snap.itemCount,
      maxGetTime: snap.maxGetTime.toISOString(),
      fetchedAt: snap.fetchedAt.toISOString(),
    };
  } catch {
    return null;
  }
}
