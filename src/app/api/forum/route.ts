import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/validate";

export async function GET() {
  const posts = await prisma.forumPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { replies: true } } },
    take: 50,
  });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  if (!rateLimit(`forum:${clientKey(request.headers)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "发帖过于频繁，10 分钟内最多 5 帖" }, { status: 429 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const post = await prisma.forumPost.create({
      data: {
        nickname: cleanText(body.nickname, 2, 16, "昵称"),
        title: cleanText(body.title, 4, 60, "标题"),
        content: cleanText(body.content, 6, 2000, "正文"),
      },
    });
    return NextResponse.json({ id: post.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "发帖失败" }, { status: 400 });
  }
}
