import Link from "next/link";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { NewPostForm } from "@/components/forum/NewPostForm";

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const posts = await prisma.forumPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { replies: true } } },
    take: 50,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="text-xs tracking-[0.2em] text-gold">FORUM</p>
        <h1 className="mt-1 text-3xl font-bold">轻论坛</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          MVP 使用匿名昵称发帖，无需注册。同一 IP 有频率限制。禁止账号交易、外挂与人身攻击。
        </p>
        <div className="mt-5 grid gap-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/forum/${p.id}`} className="rounded-sm border border-line bg-card p-4 hover:border-gold/40">
              <h2 className="font-semibold">{p.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{p.content}</p>
              <p className="mt-2 text-xs text-muted">
                {p.nickname} · {formatDate(p.createdAt)} · {p._count.replies} 回复
              </p>
            </Link>
          ))}
          {posts.length === 0 ? <p className="text-sm text-muted">还没有帖子，右侧发第一帖。</p> : null}
        </div>
      </div>
      <NewPostForm />
    </div>
  );
}
