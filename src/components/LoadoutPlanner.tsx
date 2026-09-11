"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { Stat } from "@/components/Stat";
import { BUDGET_TIERS, CATEGORY_LABEL, LOADOUT_SLOTS } from "@/lib/constants";
import { formatHaf } from "@/lib/format";
import { autoFillCheapest, emptyKit, summarizeKit, type ItemLite, type KitSlots } from "@/lib/loadout";
import { nearestTier } from "@/lib/thresholds";

export type MapOption = {
  slug: string;
  groupSlug: string;
  name: string;
  difficulty: string;
  difficultyKey: string;
  entryMin: number;
};

export type FeaturedKit = {
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
    const raw = localStorage.getItem("delta-kits-v3");
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
  initialMapSlug,
  initialKit,
}: {
  items: ItemLite[];
  maps: MapOption[];
  featured: FeaturedKit[];
  initialMapSlug?: string;
  initialKit?: KitSlots;
}) {
  const playable = maps.filter((m) => m.entryMin > 0);
  const [mapSlug, setMapSlug] = useState(initialMapSlug && playable.some((m) => m.slug === initialMapSlug) ? initialMapSlug : (playable[0]?.slug ?? ""));
  const selectedMap = playable.find((m) => m.slug === mapSlug) ?? playable[0];
  const [tierId, setTierId] = useState(() => nearestTier(selectedMap?.entryMin ?? 110000).id);
  const selectedTier = BUDGET_TIERS.find((t) => t.id === tierId) ?? BUDGET_TIERS[0];
  const budget = selectedTier.budget;

  const [active, setActive] = useState<(typeof KIT_KEYS)[number]>("A");
  const [kits, setKits] = useState<Record<(typeof KIT_KEYS)[number], KitSlots>>(() => {
    const local = loadLocal();
    if (initialKit) local.A = { ...emptyKit(), ...initialKit };
    return local as Record<(typeof KIT_KEYS)[number], KitSlots>;
  });
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [allowEmpty, setAllowEmpty] = useState(true);
  const [allowExchange, setAllowExchange] = useState(true);
  const [onlyTierKits, setOnlyTierKits] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const current = kits[active];
  const totals = useMemo(() => summarizeKit(current, items), [current, items]);
  const delta = totals.gear - budget;
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const groups = useMemo(() => {
    const g = new Map<string, MapOption[]>();
    for (const m of playable) {
      const list = g.get(m.groupSlug) ?? [];
      list.push(m);
      g.set(m.groupSlug, list);
    }
    return [...g.values()];
  }, [playable]);

  const visibleKits = useMemo(() => {
    if (!onlyTierKits) return featured;
    return featured.filter((kit) => nearestTier(kit.budget).id === selectedTier.id);
  }, [featured, onlyTierKits, selectedTier.id]);

  function persist(next: Record<(typeof KIT_KEYS)[number], KitSlots>) {
    setKits(next);
    localStorage.setItem("delta-kits-v3", JSON.stringify(next));
  }

  function pickMap(slug: string) {
    setMapSlug(slug);
    const map = playable.find((m) => m.slug === slug);
    if (map) setTierId(nearestTier(map.entryMin).id);
  }

  function pickTier(id: string) {
    setTierId(id);
    const tier = BUDGET_TIERS.find((t) => t.id === id);
    if (!tier) return;
    const match = playable.find((m) => m.entryMin === tier.budget);
    if (match) setMapSlug(match.slug);
  }

  function updateSlot(slot: string, itemId: string | null) {
    persist({ ...kits, [active]: { ...current, [slot]: itemId } });
    setPickerSlot(null);
    setQuery("");
  }

  function applyFeatured(kit: FeaturedKit) {
    persist({ ...kits, [active]: { ...emptyKit(), ...kit.slots } });
    if (kit.mapSlug && playable.some((m) => m.slug === kit.mapSlug)) pickMap(kit.mapSlug);
    else setTierId(nearestTier(kit.budget).id);
    setStatus(`已载入「${kit.name}」到方案 ${active}`);
  }

  function generate() {
    persist({ ...kits, [active]: autoFillCheapest(items, budget, { allowEmpty, allowExchange }) });
    setStatus(`已按 ${selectedTier.label} 生成最低买入配装（${allowEmpty ? "允许空槽" : "尽量填槽"}）`);
  }

  async function refreshPrices() {
    setRefreshing(true);
    setStatus("正在强制刷新公开物价…");
    try {
      const res = await fetch("/api/prices/sync?force=1");
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setStatus(data.error ?? "刷新失败");
        return;
      }
      setStatus("物价已刷新，正在重载页面…");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
  }

  async function saveServer() {
    const res = await fetch("/api/loadouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${selectedMap?.name ?? "自定义"} ${selectedMap?.difficulty ?? ""} · ${selectedTier.label} · 方案${active}`,
        budget,
        mapSlug,
        note: "用户 DIY 保存",
        style: "DIY",
        slots: current,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setStatus(data.ok ? "已保存到服务器" : data.error ?? "保存失败");
  }

  const pickerItems = useMemo(() => {
    if (!pickerSlot) return [];
    const meta = LOADOUT_SLOTS.find((s) => s.id === pickerSlot);
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (pickerSlot === "exchange") {
          if (!allowExchange && item.category === "loot") return false;
        } else if (meta && !(meta.categories as readonly string[]).includes(item.category)) {
          return false;
        }
        if (!q) return true;
        return item.name.toLowerCase().includes(q) || item.slug.includes(q) || item.subcategory.includes(q);
      })
      .sort((a, b) => a.buyPrice - b.buyPrice)
      .slice(0, 80);
  }, [items, pickerSlot, query, allowExchange]);

  return (
    <div className="grid gap-6">
      <DisclaimerBanner />

      <section className="grid gap-4 rounded-sm border border-line bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">1. 目标战备与地图难度</h2>
          <p className="text-xs text-muted">
            档位下拉对齐 orzice DIY：11万 / 18万 / 55万 / 60万 / 78万。机密与绝密分条，巴克什绝密是 55 万。
          </p>
        </div>
        <label className="grid max-w-md gap-1 text-sm">
          <span className="text-xs text-gold">目标战备</span>
          <select
            value={tierId}
            onChange={(e) => pickTier(e.target.value)}
            className="rounded-sm border border-line bg-elev px-3 py-2"
          >
            {BUDGET_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}（{t.budget.toLocaleString("zh-CN")}）· {t.maps}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3">
          {groups.map((list) => (
            <div key={list[0].groupSlug}>
              <p className="mb-1.5 text-xs text-gold">{list[0].name}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => pickMap(m.slug)}
                    className={`rounded-sm border px-3 py-1.5 text-sm ${
                      mapSlug === m.slug ? "border-gold bg-gold/15 text-gold" : "border-line hover:border-gold/40"
                    }`}
                  >
                    {m.difficulty}
                    <span className="ml-2 font-mono text-xs">{m.entryMin ? formatHaf(m.entryMin) : "无数字门槛"}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowEmpty} onChange={(e) => setAllowEmpty(e.target.checked)} />
            允许空槽
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowExchange} onChange={(e) => setAllowExchange(e.target.checked)} />
            允许部门兑换物品
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyTierKits} onChange={(e) => setOnlyTierKits(e.target.checked)} />
            只看本档最低价套
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-[#1a1406]" onClick={generate}>
            生成配装
          </button>
          <button
            type="button"
            className="rounded-sm border border-line px-3 py-2 text-sm"
            onClick={() => persist({ ...kits, [active]: autoFillCheapest(items, budget, { allowEmpty, allowExchange }) })}
          >
            最低买入凑档
          </button>
          <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" onClick={() => persist({ ...kits, [active]: emptyKit() })}>
            清空本方案
          </button>
          <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" onClick={() => void saveServer()}>
            保存到服务器
          </button>
          <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" disabled={refreshing} onClick={() => void refreshPrices()}>
            {refreshing ? "刷新中…" : "刷新数据"}
          </button>
          <span className="text-xs text-muted">方案 A/B/C 存在本机，刷新还在</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">推荐套（本档最低价 / 载入当前方案）</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {visibleKits.map((kit) => (
            <button key={kit.id} type="button" onClick={() => applyFeatured(kit)} className="card-lift rounded-sm border border-line bg-elev p-3 text-left">
              <p className="text-xs text-gold">
                {kit.style} · {formatHaf(kit.budget)}
              </p>
              <p className="mt-1 font-medium">{kit.name}</p>
              <p className="mt-1 text-xs text-muted">{kit.note}</p>
            </button>
          ))}
          {visibleKits.length === 0 ? <p className="text-sm text-muted">本档暂无推荐套，关掉「只看本档」可看全部。</p> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-sm border border-line bg-card p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {KIT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={`rounded-sm px-3 py-1.5 text-sm ${active === key ? "bg-gold text-[#1a1406]" : "border border-line"}`}
              >
                方案 {key}
              </button>
            ))}
          </div>
          <h2 className="mb-3 text-lg font-semibold">2. 按槽位 DIY</h2>
          <div className="grid gap-2">
            {LOADOUT_SLOTS.map((slot) => {
              const item = current[slot.id] ? byId.get(current[slot.id] as string) : undefined;
              return (
                <div key={slot.id} className="grid grid-cols-[108px_1fr_auto] items-center gap-2 rounded-sm border border-line bg-elev px-3 py-2">
                  <span className="text-xs text-muted">{slot.label}</span>
                  <button type="button" className="text-left text-sm hover:text-gold" onClick={() => setPickerSlot(slot.id)}>
                    {item ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{item.name}</span>
                        <ItemBadge rarity={item.rarity} level={item.level} />
                        <span className="font-mono text-xs text-muted">买 {formatHaf(item.buyPrice)}</span>
                      </span>
                    ) : (
                      <span className="text-muted">空槽 · 点此从行情库选择</span>
                    )}
                  </button>
                  {item ? (
                    <button type="button" className="text-xs text-danger" onClick={() => updateSlot(slot.id, null)}>
                      留空
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted">可空</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="grid h-fit gap-3 rounded-sm border border-line bg-card p-4">
          <h2 className="font-semibold">实时结算</h2>
          <p className="text-xs text-muted">
            {selectedMap?.name} · {selectedMap?.difficulty} · 目标 {selectedTier.label}
          </p>
          <Stat label="目标战备" value={formatHaf(budget)} />
          <Stat label="战备（按行情计入）" value={formatHaf(totals.gear)} tone="gold" />
          <Stat label="花费（买入合计）" value={formatHaf(totals.buy)} hint={`估算出售 ${formatHaf(totals.sell)}`} />
          <Stat
            label="节省（战备 − 花费）"
            value={`${totals.savings >= 0 ? "+" : ""}${formatHaf(totals.savings)}`}
            tone={totals.savings >= 0 ? "ok" : "danger"}
            hint="正数表示行情战备高于买入"
          />
          <Stat
            label="距门槛"
            value={`${delta >= 0 ? "+" : ""}${formatHaf(delta)}`}
            tone={delta >= 0 ? "ok" : "danger"}
            hint={delta >= 0 ? "已过线（演示）" : "还没够，点生成配装或加件"}
          />
          <div className="rounded-sm border border-line bg-elev p-3">
            <p className="text-[11px] text-muted">三方案花费 / 战备 / 节省</p>
            <div className="mt-2 grid gap-1 text-xs">
              {KIT_KEYS.map((key) => {
                const t = summarizeKit(kits[key], items);
                return (
                  <p key={key} className="flex justify-between font-mono">
                    <span>方案 {key}</span>
                    <span className={t.gear >= budget ? "text-olive" : "text-danger"}>
                      {formatHaf(t.buy)} / {formatHaf(t.gear)} / {formatHaf(t.savings)}
                    </span>
                  </p>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      {status ? <p className="text-sm text-olive">{status}</p> : null}

      {pickerSlot ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPickerSlot(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-sm border border-line bg-[#121920]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-medium">行情库选装（可留空）</p>
              <button type="button" onClick={() => setPickerSlot(null)} className="text-sm text-muted">
                关闭
              </button>
            </div>
            <div className="p-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜名称，例如 AWM、头盔、5.56…"
                className="mb-3 w-full rounded-sm border border-line bg-elev px-3 py-2 text-sm"
              />
              <button type="button" className="mb-3 text-xs text-danger" onClick={() => updateSlot(pickerSlot, null)}>
                这个槽留空
              </button>
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
                      行情 {formatHaf(item.buyPrice)} · 估售 {formatHaf(item.sellPrice)}
                    </span>
                  </button>
                ))}
                {pickerItems.length === 0 ? <p className="text-sm text-muted">没有匹配装备</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        完整行情见{" "}
        <Link href="/items" className="text-gold underline">
          装备物价
        </Link>
        。AWM 应约为 83 万级（830999），不能是约 10 万的旧示例。
      </p>
    </div>
  );
}
