import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide) notFound();

  return (
    <article className="grid gap-6">
      <Link href="/guides" className="text-sm text-gold hover:underline">
        ← 全部攻略
      </Link>
      <header className="rounded-sm border border-line bg-card p-6">
        <p className="text-xs text-gold">
          {guide.category} · {formatDate(guide.publishedAt)}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{guide.title}</h1>
        <p className="mt-3 text-sm text-muted">{guide.excerpt}</p>
      </header>
      <div className="prose-delta rounded-sm border border-line bg-card p-6">
        <ReactMarkdown>{guide.content}</ReactMarkdown>
      </div>
    </article>
  );
}
