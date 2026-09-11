import { NextResponse } from "next/server";
import { ensureFreshPrices } from "@/lib/price-sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const wait = searchParams.get("wait") !== "0";
  const result = await ensureFreshPrices({ wait, force });
  return NextResponse.json(result);
}
