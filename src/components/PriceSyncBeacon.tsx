"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** 页面使用时后台/按 TTL 拉一次物价，不阻塞 HTML 渲染。 */
export function PriceSyncBeacon() {
  const router = useRouter();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    void fetch("/api/prices/sync")
      .then((res) => res.json() as Promise<{ didRefresh?: boolean }>)
      .then((data) => {
        if (data.didRefresh) router.refresh();
      })
      .catch(() => undefined);
  }, [router]);

  return null;
}
