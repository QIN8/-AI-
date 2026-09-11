import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-[#0a0d11]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-semibold text-gold">{SITE_NAME}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            面向《三角洲行动》烽火地带的玩家工具站。行情来自 Orzice 公开转储，不代表腾讯或天美官方。
          </p>
        </div>
        <div className="text-sm text-muted">
          <p className="mb-2 text-sand">栏目</p>
          <div className="grid gap-1">
            <Link href="/loadout" className="hover:text-gold">
              卡战备计算器
            </Link>
            <Link href="/items" className="hover:text-gold">
              装备与物价
            </Link>
            <Link href="/maps" className="hover:text-gold">
              地图门槛
            </Link>
            <Link href="/guides" className="hover:text-gold">
              攻略帮助
            </Link>
          </div>
        </div>
        <div className="text-sm leading-6 text-muted">
          <p className="mb-2 text-sand">声明</p>
          <p>
            更新物价：覆盖 <code className="text-gold/80">prisma/data/orzice-price.json</code> 后{" "}
            <code className="text-gold/80">npm run db:seed</code>。使用本站请遵守游戏 ToS，勿用于账号交易或作弊。
          </p>
        </div>
      </div>
    </footer>
  );
}
