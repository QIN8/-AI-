import { formatDate } from "@/lib/format";
import type { SnapshotDTO } from "@/lib/snapshot";

export function DataTicker({ snapshot }: { snapshot: SnapshotDTO }) {
  if (!snapshot) {
    return (
      <div className="ticker border-b border-line bg-[#10161d] px-4 py-1.5 text-center text-[12px] text-muted">
        物价尚未种子。本地执行 <code className="text-gold/80">npm run db:seed</code> 导入 Orzice 公开转储。
      </div>
    );
  }

  return (
    <div className="ticker border-b border-gold/25 bg-[#14100a] px-4 py-1.5 text-center text-[12px] text-sand/80">
      数据更新于 {formatDate(snapshot.maxGetTime)} · 本站同步于 {formatDate(snapshot.fetchedAt)} · {snapshot.itemCount}{" "}
      件 · {snapshot.source}
      <span className="text-muted"> · 非官方、非合作关系</span>
    </div>
  );
}
