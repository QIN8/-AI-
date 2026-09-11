import type { Metadata } from "next";
import { DataTicker } from "@/components/DataTicker";
import { PriceSyncBeacon } from "@/components/PriceSyncBeacon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { getPriceSnapshot } from "@/lib/snapshot";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: `《三角洲行动》非官方${SITE_TAGLINE}。卡战备凑装、Orzice 公开行情转储、地图门槛与玩家论坛。`,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getPriceSnapshot();

  return (
    <html lang="zh-Hans">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <PriceSyncBeacon />
        <DataTicker snapshot={snapshot} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
