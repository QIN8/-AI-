import type { Item } from "@prisma/client";
import { LOADOUT_SLOTS } from "./constants";

export type SlotId = (typeof LOADOUT_SLOTS)[number]["id"];

export type KitSlots = Partial<Record<SlotId, string | null>>;

export type ItemLite = Pick<
  Item,
  | "id"
  | "slug"
  | "name"
  | "category"
  | "subcategory"
  | "rarity"
  | "level"
  | "buyPrice"
  | "sellPrice"
  | "gearValue"
  | "fakeAdjust"
  | "weight"
>;

export type KitTotals = {
  buy: number;
  sell: number;
  gear: number;
  fakeGear: number;
  weight: number;
  count: number;
  ratio: number;
};

export function emptyKit(): KitSlots {
  return Object.fromEntries(LOADOUT_SLOTS.map((s) => [s.id, null])) as KitSlots;
}

export function summarizeKit(slots: KitSlots, items: ItemLite[], fakeMode: boolean): KitTotals {
  const byId = new Map(items.map((i) => [i.id, i]));
  let buy = 0;
  let sell = 0;
  let gear = 0;
  let fakeGear = 0;
  let weight = 0;
  let count = 0;

  for (const id of Object.values(slots)) {
    if (!id) continue;
    const item = byId.get(id);
    if (!item) continue;
    buy += item.buyPrice;
    sell += item.sellPrice;
    gear += item.gearValue;
    fakeGear += Math.round(item.gearValue * item.fakeAdjust);
    weight += item.weight;
    count += 1;
  }

  const effective = fakeMode ? fakeGear : gear;
  return {
    buy,
    sell,
    gear,
    fakeGear,
    weight,
    count,
    ratio: buy > 0 ? effective / buy : 0,
  };
}

export function autoFillKit(items: ItemLite[], budget: number, fakeMode: boolean): KitSlots {
  const kit = emptyKit();
  const used = new Set<string>();

  const score = (item: ItemLite) => {
    const gear = fakeMode ? item.gearValue * item.fakeAdjust : item.gearValue;
    return item.buyPrice > 0 ? gear / item.buyPrice : 0;
  };

  for (const slot of LOADOUT_SLOTS) {
    const candidates = items
      .filter((i) => (slot.categories as readonly string[]).includes(i.category) && !used.has(i.id))
      .sort((a, b) => score(b) - score(a) || b.gearValue - a.gearValue);

    const pick = candidates[0];
    if (pick) {
      kit[slot.id] = pick.id;
      used.add(pick.id);
    }
  }

  const over = (s: KitSlots) => summarizeKit(s, items, fakeMode);

  const effectiveOf = (item: ItemLite) =>
    fakeMode ? Math.round(item.gearValue * item.fakeAdjust) : item.gearValue;

  const target = budget;
  const current = () => (fakeMode ? over(kit).fakeGear : over(kit).gear);

  if (current() < target) {
    for (const slot of [...LOADOUT_SLOTS].reverse()) {
      if (current() >= target) break;
      const currentId = kit[slot.id];
      const currentItem = items.find((i) => i.id === currentId);
      const alternatives = items
        .filter((i) => (slot.categories as readonly string[]).includes(i.category) && !used.has(i.id))
        .sort((a, b) => effectiveOf(b) - effectiveOf(a));
      const better = alternatives.find((i) => !currentItem || effectiveOf(i) > effectiveOf(currentItem));
      if (better) {
        if (currentItem) used.delete(currentItem.id);
        kit[slot.id] = better.id;
        used.add(better.id);
      }
    }
  }

  if (current() > target * 1.18) {
    for (const slot of LOADOUT_SLOTS) {
      if (current() <= target * 1.05) break;
      const currentId = kit[slot.id];
      const currentItem = items.find((i) => i.id === currentId);
      if (!currentItem) continue;
      const cheaper = items
        .filter(
          (i) =>
            (slot.categories as readonly string[]).includes(i.category) &&
            !used.has(i.id) &&
            effectiveOf(i) < effectiveOf(currentItem),
        )
        .sort((a, b) => effectiveOf(b) - effectiveOf(a))[0];
      if (!cheaper) continue;
      const next = { ...kit, [slot.id]: cheaper.id };
      const nextVal = fakeMode ? over(next).fakeGear : over(next).gear;
      if (nextVal >= target) {
        used.delete(currentItem.id);
        used.add(cheaper.id);
        kit[slot.id] = cheaper.id;
      }
    }
  }

  return kit;
}

export function kitToEntries(slots: KitSlots): { slot: string; itemId: string }[] {
  return Object.entries(slots)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([slot, itemId]) => ({ slot, itemId }));
}
