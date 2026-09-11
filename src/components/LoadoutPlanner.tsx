"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { Stat } from "@/components/Stat";
import { BUDGET_TIERS, CATEGORY_LABEL, LOADOUT_SLOTS } from "@/lib/constants";
import { formatHaf, formatKg } from "@/lib/format";
import {
  autoFillKit,
  emptyKit,
  summarizeKit,
  type ItemLite,
  type KitSlots,
} from "@/lib/loadout";

type MapLite = { slug: string; name: string; entryMin: number; difficulty: string };
type FeaturedKit = {
  id: string;
  name: string;
  budget: number;
  mapSlug: string;
  note: string;
  style: string;
  slots: KitSlots;
};

const KIT_KEYS = ["A", "B", "C"] as const;

function loadLocal(): Record<string, KitSlots> {
  if (typeof window === "undefined") return { A: emptyKit(), B: emptyKit(), C: emptyKit() };
  try {
    const raw = localStorage.getItem("delta-kits");
    if (!raw) return { A: emptyKit(), B: emptyKit(), C: emptyKit() };
    const parsed = JSON.parse(raw) as Record<string, KitSlots>;
    return {
      A: { ...emptyKit(), ...parsed.A },
      B: { ...emptyKit(), ...parsed.B },
      C: { ...emptyKit(), ...parsed.C },
    };
  } catch {
    return { A: emptyKit(), B: emptyKit(), C: emptyKit() };
  }
}

export function LoadoutPlanner({
  items,
  maps,
  featured,
  initialBudget,
  initialKit,
}: {
  items: ItemLite[];
  maps: MapLite[];
  featured: FeaturedKit[];
  initialBudget?: number;
  initialKit?: KitSlots;
}) {
  const [budget, setBudget] = useState(initialBudget ?? 112500);
  const [mapSlug, setMapSlug] = useState(maps.find((m) => m.entryMin === (initialBudget ?? 112500))?.slug ?? maps[0]?.slug ?? "");
  const [fakeMode, setFakeMode] = useState(true);
  const [active, setActive] = useState<(typeof KIT_KEYS)[number]>("A");
  const [kits, setKits] = useState<Record<(typeof KIT_KEYS)[number], KitSlots>>(() => {
    const local = loadLocal();
    if (initialKit) local.A = { ...emptyKit(), ...initialKit };
    return local as Record<(typeof KIT_KEYS)[number], KitSlots>;
  });
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const current = kits[active];
  const totals = useMemo(() => summarizeKit(current, items, fakeMode), [current, items, fakeMode]);
  const effective = fakeMode ? totals.fakeGear : totals.gear;
  const delta = effective - budget;
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function persist(next: Record<(typeof KIT_KEYS)[number], KitSlots>) {
    setKits(next);
    localStorage.setItem("delta-kits", JSON.stringify(next));
  }

  function updateSlot(slot: string, itemId: string | null) {
    persist({ ...kits, [active]: { ...current, [slot]: itemId } });
    setPickerSlot(null);
    setQuery("");
  }

  function applyFeatured(kit: FeaturedKit) {
    persist({ ...kits, [active]: { ...emptyKit(), ...kit.slots } });
    setBudget(kit.budget);
    if (kit.mapSlug) setMapSlug(kit.mapSlug);
    setStatus(`已载入推荐套「${kit.name}」到方案 ${active}`);
  }

  async function saveServer() {
    const res = await fetch("/api/loadouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `方案${active} · ${formatHaf(budget)}`,
        budget,
        mapSlug,
        note: fakeMode ? "假账模式演示保存" : "标准战备演示保存",
        style: "自定义",
        slots: current,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setStatus(data.ok ? "已保存到服务器（可在本页推荐区之外通过数据库查看）" : data.error ?? "保存失败");
  }

  const pickerItems = useMemo(() => {
    if (!pickerSlot) return [];
    const meta = LOADOUT_SLOTS.find((s) => s.id === pickerSlot);
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (meta && !(meta.categories as readonly string[]).includes(item.category)) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.slug.includes(q);
    });
  }, [items, pickerSlot, query]);

  return (
    <div className="grid gap-6">
      <DisclaimerBanner />

      <section className="grid gap-3 rounded-sm border border-line bg-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">档位与地图</h2>
            <p className="text-xs text-muted">选门槛后凑装。假账模式按每件系数放大战备，对应社区「假账进图」演示。</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fakeMode} onChange={(e) => setFakeMode(e.target.checked)} />
            假账模式
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUDGET_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setBudget(t.budget);
                const m = maps.find((x) => x.entryMin === t.budget);
                if (m) setMapSlug(m.slug);
              }}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                budget === t.budget ? "border-gold bg-gold/15 text-gold" : "border-line hover:border-gold/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">对照地图</span>
            <select
              className="rounded-sm border border-line bg-elev px-3 py-2"
              value={mapSlug}
              onChange={(e) => {
                const next = e.target.value;
                setMapSlug(next);
                const m = maps.find((x) => x.slug === next);
                if (m) setBudget(m.entryMin);
              }}
            >
              {maps.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} · {m.difficulty} · {formatHaf(m.entryMin)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              className="rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-[#1a1406]"
              onClick={() => persist({ ...kits, [active]: autoFillKit(items, budget, fakeMode) })}
            >
              自动凑档
            </button>
            <button
              type="button"
              className="rounded-sm border border-line px-3 py-2 text-sm"
              onClick={() => persist({ ...kits, [active]: emptyKit() })}
            >
              清空本方案
            </button>
            <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" onClick={() => void saveServer()}>
              保存到服务器
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">推荐套（载入到当前方案）</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {featured.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => applyFeatured(kit)}
              className="rounded-sm border border-line bg-elev p-3 text-left hover:border-gold/40"
            >
              <p className="text-xs text-gold">
                {kit.style} · {formatHaf(kit.budget)}
              </p>
              <p className="mt-1 font-medium">{kit.name}</p>
              <p className="mt-1 text-xs text-muted">{kit.note}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-sm border border-line bg-card p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {KIT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={`rounded-sm px-3 py-1.5 text-sm ${
                  active === key ? "bg-gold text-[#1a1406]" : "border border-line"
                }`}
              >
                方案 {key}
              </button>
            ))}
            <span className="self-center text-xs text-muted">本地最多对比 3 套，刷新仍保留</span>
          </div>
          <div className="grid gap-2">
            {LOADOUT_SLOTS.map((slot) => {
              const item = current[slot.id] ? byId.get(current[slot.id] as string) : undefined;
              return (
                <div key={slot.id} className="grid grid-cols-[110px_1fr_auto] items-center gap-2 rounded-sm border border-line bg-elev px-3 py-2">
                  <span className="text-xs text-muted">{slot.label}</span>
                  <button type="button" className="text-left text-sm hover:text-gold" onClick={() => setPickerSlot(slot.id)}>
                    {item ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{item.name}</span>
                        <ItemBadge rarity={item.rarity} level={item.level} />
                        <span className="font-mono text-xs text-muted">
                          战备 {formatHaf(item.gearValue)} / 买 {formatHaf(item.buyPrice)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted">点击选择装备</span>
                    )}
                  </button>
                  {item ? (
                    <button type="button" className="text-xs text-danger" onClick={() => updateSlot(slot.id, null)}>
                      移除
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="grid h-fit gap-3 rounded-sm border border-line bg-card p-4">
          <h2 className="font-semibold">实时结算</h2>
          <Stat label="门槛" value={formatHaf(budget)} />
          <Stat label={fakeMode ? "假账战备" : "战备价值"} value={formatHaf(effective)} tone="gold" />
          <Stat
            label="距门槛"
            value={`${delta >= 0 ? "+" : ""}${formatHaf(delta)}`}
            tone={delta >= 0 ? "ok" : "danger"}
            hint={delta >= 0 ? "已过线，可以进图（演示）" : "还没够，继续加件或开自动凑档"}
          />
          <Stat label="买入合计" value={formatHaf(totals.buy)} hint={`出售合计 ${formatHaf(totals.sell)}`} />
          <Stat label="标准战备" value={formatHaf(totals.gear)} hint={`假账战备 ${formatHaf(totals.fakeGear)}`} />
          <Stat label="性价比" value={totals.ratio ? `${totals.ratio.toFixed(2)}x` : "—"} hint="有效战备 / 买入" />
          <Stat label="重量（示意）" value={formatKg(totals.weight)} />
          <CompareMini kits={kits} items={items} fakeMode={fakeMode} budget={budget} />
        </aside>
      </section>

      {status ? <p className="text-sm text-olive">{status}</p> : null}

      {pickerSlot ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPickerSlot(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-sm border border-line bg-[#121920]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-medium">选择装备</p>
              <button type="button" onClick={() => setPickerSlot(null)} className="text-sm text-muted">
                关闭
              </button>
            </div>
            <div className="p-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索名称…"
                className="mb-3 w-full rounded-sm border border-line bg-elev px-3 py-2 text-sm"
              />
              <div className="grid max-h-[50vh] gap-2 overflow-auto">
                {pickerItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSlot(pickerSlot, item.id)}
                    className="grid gap-1 rounded-sm border border-line bg-card px-3 py-2 text-left hover:border-gold/40"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <ItemBadge rarity={item.rarity} level={item.level} />
                      <span className="text-xs text-muted">{CATEGORY_LABEL[item.category]}</span>
                    </span>
                    <span className="font-mono text-xs text-muted">
                      买 {formatHaf(item.buyPrice)} · 售 {formatHaf(item.sellPrice)} · 战备 {formatHaf(item.gearValue)} · 假账{" "}
                      {item.fakeAdjust.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        装备详情见{" "}
        <Link href="/items" className="text-gold underline">
          物价目录
        </Link>
        。推荐套来自种子数据，可在 JSON 中改。
      </p>
    </div>
  );
}

function CompareMini({
  kits,
  items,
  fakeMode,
  budget,
}: {
  kits: Record<(typeof KIT_KEYS)[number], KitSlots>;
  items: ItemLite[];
  fakeMode: boolean;
  budget: number;
}) {
  return (
    <div className="rounded-sm border border-line bg-elev p-3">
      <p className="text-[11px] text-muted">三方案对比</p>
      <div className="mt-2 grid gap-1 text-xs">
        {KIT_KEYS.map((key) => {
          const t = summarizeKit(kits[key], items, fakeMode);
          const val = fakeMode ? t.fakeGear : t.gear;
          return (
            <p key={key} className="flex justify-between font-mono">
              <span>方案 {key}</span>
              <span className={val >= budget ? "text-olive" : "text-danger"}>
                {formatHaf(val)} / 买 {formatHaf(t.buy)}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
