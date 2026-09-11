import { OFFICIAL_MAP_TOOL } from "@/lib/constants";

export function OfficialMapPanel() {
  return (
    <section className="grid gap-3 rounded-sm border border-line bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">官方地图工具</h2>
          <p className="mt-1 text-sm text-muted">
            嵌入腾讯官方目录图。物资点图层本站先做占位：下一步可按官方坐标 JSON 导入出生/撤离/箱点标记。
          </p>
        </div>
        <a href={OFFICIAL_MAP_TOOL} target="_blank" rel="noreferrer" className="rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-[#1a1406]">
          新窗口打开官方图
        </a>
      </div>
      <div className="overflow-hidden rounded-sm border border-line bg-elev">
        <iframe title="三角洲行动官方地图工具" src={OFFICIAL_MAP_TOOL} className="h-[480px] w-full bg-[#0b0f14]" />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {["出生点（占位）", "撤离点（占位）", "高价值箱（占位）"].map((label) => (
          <div key={label} className="rounded-sm border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
            {label}
            <p className="mt-1 text-xs">未导入官方坐标，避免臆造点位</p>
          </div>
        ))}
      </div>
    </section>
  );
}
