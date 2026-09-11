export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-sm border border-gold/30 bg-gold/8 px-3 py-2 text-xs leading-6 text-sand/80">
      {compact
        ? "行情来自 Orzice 公开转储，非官方实时 API。"
        : "买入价来自 Orzice 公开转储 + 公开页覆盖，不是腾讯官方接口。卡战备里的「战备」暂按行情价合计；出售价按约 72% 估算。地图机密/绝密门槛分条记录（巴克什绝密 55 万），进图以游戏内提示为准。"}
    </div>
  );
}
