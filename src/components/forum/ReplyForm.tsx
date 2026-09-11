"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/forum/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: form.get("nickname"),
        content: form.get("content"),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "回复失败");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-sm border border-line bg-card p-4">
      <h3 className="font-semibold">写回复</h3>
      <label className="mt-3 grid gap-1 text-sm">
        昵称
        <input name="nickname" required minLength={2} maxLength={16} className="rounded-sm border border-line bg-elev px-3 py-2" />
      </label>
      <label className="mt-3 grid gap-1 text-sm">
        内容
        <textarea name="content" required minLength={2} maxLength={1200} rows={4} className="rounded-sm border border-line bg-elev px-3 py-2" />
      </label>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <button disabled={pending} className="mt-3 rounded-sm bg-gold px-4 py-2 text-sm font-semibold text-[#1a1406]">
        {pending ? "提交中…" : "回复"}
      </button>
    </form>
  );
}
