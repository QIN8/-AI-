"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewPostForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        nickname: form.get("nickname"),
        content: form.get("content"),
      }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "发帖失败");
      return;
    }
    e.currentTarget.reset();
    router.push(`/forum/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="h-fit rounded-sm border border-line bg-card p-4">
      <h2 className="font-semibold">发帖</h2>
      <p className="mt-1 text-xs text-muted">昵称 2–16 字，正文至少 6 字。每 10 分钟最多 5 帖。</p>
      <label className="mt-3 grid gap-1 text-sm">
        昵称
        <input name="nickname" required minLength={2} maxLength={16} className="rounded-sm border border-line bg-elev px-3 py-2" />
      </label>
      <label className="mt-3 grid gap-1 text-sm">
        标题
        <input name="title" required minLength={4} maxLength={60} className="rounded-sm border border-line bg-elev px-3 py-2" />
      </label>
      <label className="mt-3 grid gap-1 text-sm">
        正文
        <textarea name="content" required minLength={6} maxLength={2000} rows={6} className="rounded-sm border border-line bg-elev px-3 py-2" />
      </label>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <button disabled={pending} className="mt-3 w-full rounded-sm bg-gold py-2 text-sm font-semibold text-[#1a1406] disabled:opacity-60">
        {pending ? "提交中…" : "发布"}
      </button>
    </form>
  );
}
