export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-sm border border-gold/30 bg-gold/8 px-3 py-2 text-xs leading-6 text-sand/80">
      {compact
        ? "价格与战备为示例快照，非官方实时行情。"
        : "装备买入价、出售价、战备价值与假账系数为社区风格示例快照，仅供凑装演示。未接入官方 API，也不保证与当前赛季交易行一致。地图门槛整理自公开资料，进图前以游戏内提示为准。"}
    </div>
  );
}
