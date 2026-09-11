"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ItemBadge } from "@/components/ItemBadge";
import { Stat } from "@/components/Stat";
import { CATEGORY_LABEL, LOADOUT_SLOTS } from "@/lib/constants";
import { formatHaf } from "@/lib/format";
import { autoFillCheapest, emptyKit, summarizeKit, type ItemLite, type KitSlots } from "@/lib/loadout";

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
    const raw = localStorage.getItem("delta-kits-v2");
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
  const budget = selectedMap?.entryMin ?? 110000;

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

  function persist(next: Record<(typeof KIT_KEYS)[number], KitSlots>) {
    setKits(next);
    localStorage.setItem("delta-kits-v2", JSON.stringify(next));
  }

  function updateSlot(slot: string, itemId: string | null) {
    persist({ ...kits, [active]: { ...current, [slot]: itemId } });
    setPickerSlot(null);
    setQuery("");
  }

  function applyFeatured(kit: FeaturedKit) {
    persist({ ...kits, [active]: { ...emptyKit(), ...kit.slots } });
    if (kit.mapSlug && playable.some((m) => m.slug === kit.mapSlug)) setMapSlug(kit.mapSlug);
    setStatus(`已载入「${kit.name}」到方案 ${active}`);
  }

  async function saveServer() {
    const res = await fetch("/api/loadouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${selectedMap?.name ?? "自定义"} ${selectedMap?.difficulty ?? ""} · 方案${active}`,
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
        if (meta && !(meta.categories as readonly string[]).includes(item.category)) return false;
        if (!q) return true;
        return item.name.toLowerCase().includes(q) || item.slug.includes(q) || item.subcategory.includes(q);
      })
      .sort((a, b) => a.buyPrice - b.buyPrice)
      .slice(0, 80);
  }, [items, pickerSlot, query]);

  return (
    <div className="grid gap-6">
      <DisclaimerBanner />

      <section className="grid gap-4 rounded-sm border border-line bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">1. 选地图与难度</h2>
          <p className="text-xs text-muted">机密 / 绝密分开选，门槛不会混在一起。巴克什绝密是 58 万，不是机密 18.75 万。</p>
        </div>
        <div className="grid gap-3">
          {groups.map((list) => (
            <div key={list[0].groupSlug}>
              <p className="mb-1.5 text-xs text-gold">{list[0].name}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => setMapSlug(m.slug)}
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-[#1a1406]"
            onClick={() => persist({ ...kits, [active]: autoFillCheapest(items, budget) })}
          >
            最低买入凑档
          </button>
          <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" onClick={() => persist({ ...kits, [active]: emptyKit() })}>
            清空本方案
          </button>
          <button type="button" className="rounded-sm border border-line px-3 py-2 text-sm" onClick={() => void saveServer()}>
            保存到服务器
          </button>
          <span className="text-xs text-muted">方案 A/B/C 存在本机，刷新还在</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">推荐套（载入当前方案）</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {featured.map((kit) => (
            <button key={kit.id} type="button" onClick={() => applyFeatured(kit)} className="card-lift rounded-sm border border-line bg-elev p-3 text-left">
              <p className="text-xs text-gold">
                {kit.style} · {formatHaf(kit.budget)}
              </p>
              <p className="mt-1 font-medium">{kit.name}</p>
              <p className="mt-1 text-xs text-muted">{kit.note}</p>
            </button>
          ))}
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
                <div key={slot.id} className="grid grid-cols-[100px_1fr_auto] items-center gap-2 rounded-sm border border-line bg-elev px-3 py-2">
                  <span className="text-xs text-muted">
                    {slot.label}
                    {slot.essential ? <span className="text-gold"> *</span> : null}
                  </span>
                  <button type="button" className="text-left text-sm hover:text-gold" onClick={() => setPickerSlot(slot.id)}>
                    {item ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{item.name}</span>
                        <ItemBadge rarity={item.rarity} level={item.level} />
                        <span className="font-mono text-xs text-muted">买 {formatHaf(item.buyPrice)}</span>
                      </span>
                    ) : (
                      <span className="text-muted">从行情库选择…</span>
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
          <p className="text-xs text-muted">
            {selectedMap?.name} · {selectedMap?.difficulty}
          </p>
          <Stat label="入场门槛" value={formatHaf(budget)} />
          <Stat label="战备（按行情计入）" value={formatHaf(totals.gear)} tone="gold" />
          <Stat
            label="距门槛"
            value={`${delta >= 0 ? "+" : ""}${formatHaf(delta)}`}
            tone={delta >= 0 ? "ok" : "danger"}
            hint={delta >= 0 ? "已过线（演示）" : "还没够，点最低买入或加件"}
          />
          <Stat label="买入合计" value={formatHaf(totals.buy)} hint={`估算出售 ${formatHaf(totals.sell)}`} />
          <div className="rounded-sm border border-line bg-elev p-3">
            <p className="text-[11px] text-muted">三方案买入 / 战备</p>
            <div className="mt-2 grid gap-1 text-xs">
              {KIT_KEYS.map((key) => {
                const t = summarizeKit(kits[key], items);
                return (
                  <p key={key} className="flex justify-between font-mono">
                    <span>方案 {key}</span>
                    <span className={t.gear >= budget ? "text-olive" : "text-danger"}>
                      买 {formatHaf(t.buy)} / {formatHaf(t.gear)}
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
              <p className="font-medium">行情库选装</p>
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
        。AWM 等应显示数十万级行情，而不是约 10 万的旧示例。
      </p>
    </div>
  );
}
