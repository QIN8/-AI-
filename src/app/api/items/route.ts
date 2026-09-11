import { NextResponse } from "next/server";
import { ensureFreshPrices } from "@/lib/price-sync";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  void ensureFreshPrices({ wait: false });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "all";

  const items = await prisma.item.findMany({
    where: {
      AND: [
        category !== "all" ? { category } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { slug: { contains: q } },
                { subcategory: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ category: "asc" }, { gearValue: "desc" }],
    take: 200,
  });

  return NextResponse.json({ items });
}
