import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/validate";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`reply:${clientKey(request.headers)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "回复过于频繁，请稍后再试" }, { status: 429 });
  }

  const { id } = await params;
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "帖子不存在" }, { status: 404 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reply = await prisma.forumReply.create({
      data: {
        postId: id,
        nickname: cleanText(body.nickname, 2, 16, "昵称"),
        content: cleanText(body.content, 2, 1200, "内容"),
      },
    });
    return NextResponse.json({ id: reply.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "回复失败" }, { status: 400 });
  }
}
