import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/forum" className="text-sm text-gold hover:underline">
        ← 返回列表
      </Link>
      <article className="rounded-sm border border-line bg-card p-6">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="mt-2 text-xs text-muted">
          {post.nickname} · {formatDate(post.createdAt)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-sand/85">{post.content}</p>
      </article>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">回复（{post.replies.length}）</h2>
        {post.replies.map((r) => (
          <div key={r.id} className="rounded-sm border border-line bg-elev p-4">
            <p className="text-xs text-muted">
              {r.nickname} · {formatDate(r.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{r.content}</p>
          </div>
        ))}
      </section>
      <ReplyForm postId={post.id} />
    </div>
  );
}
