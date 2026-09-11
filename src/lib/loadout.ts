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
  savings: number;
};

export type FillOptions = {
  allowEmpty?: boolean;
  allowExchange?: boolean;
};

export function emptyKit(): KitSlots {
  return Object.fromEntries(LOADOUT_SLOTS.map((s) => [s.id, null])) as KitSlots;
}

export function summarizeKit(slots: KitSlots, items: ItemLite[], fakeMode = false): KitTotals {
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
    savings: effective - buy,
  };
}

function inSlot(item: ItemLite, categories: readonly string[]) {
  return (categories as readonly string[]).includes(item.category);
}

function pool(items: ItemLite[], categories: readonly string[], used: Set<string>) {
  return items.filter((i) => inSlot(i, categories) && !used.has(i.id) && i.buyPrice > 0 && i.gearValue > 0);
}

function combatPool(items: ItemLite[], allowExchange: boolean) {
  return items.filter((i) => {
    if (i.category === "key") return false;
    if (i.category === "loot") return allowExchange;
    return true;
  });
}

/** 最低买入凑档：可留空槽、可选兑换物，再按「每哈夫币战备」补齐到门槛。 */
export function autoFillCheapest(items: ItemLite[], budget: number, opts: FillOptions = {}): KitSlots {
  const allowEmpty = opts.allowEmpty ?? true;
  const allowExchange = opts.allowExchange ?? true;
  const kit = emptyKit();
  const used = new Set<string>();
  const combat = combatPool(items, allowExchange);

  if (!allowEmpty) {
    for (const slot of LOADOUT_SLOTS.filter((s) => s.preferred)) {
      const pick = pool(combat, slot.categories, used).sort((a, b) => a.buyPrice - b.buyPrice || b.gearValue - a.gearValue)[0];
      if (pick) {
        kit[slot.id] = pick.id;
        used.add(pick.id);
      }
    }
  }

  const over = (s: KitSlots) => summarizeKit(s, combat, false);
  const gearOf = () => over(kit).gear;

  let guard = 0;
  while (gearOf() < budget && guard++ < 80) {
    type Move = { buyDelta: number; gearDelta: number; apply: () => void };
    const moves: Move[] = [];

    const empty = LOADOUT_SLOTS.find((s) => {
      if (kit[s.id]) return false;
      if (s.id === "exchange" && !allowExchange) return false;
      return true;
    });
    if (empty) {
      const pick = pool(combat, empty.categories, used).sort(
        (a, b) => b.gearValue / Math.max(1, a.buyPrice) - a.gearValue / Math.max(1, b.buyPrice) || a.buyPrice - b.buyPrice,
      )[0];
      if (pick) {
        moves.push({
          buyDelta: pick.buyPrice,
          gearDelta: pick.gearValue,
          apply: () => {
            kit[empty.id] = pick.id;
            used.add(pick.id);
          },
        });
      }
    }

    for (const slot of LOADOUT_SLOTS) {
      const currentId = kit[slot.id];
      const current = combat.find((i) => i.id === currentId);
      if (!current) continue;
      const alt = pool(combat, slot.categories, used)
        .filter((i) => i.gearValue > current.gearValue)
        .sort((a, b) => {
          const ea = (a.buyPrice - current.buyPrice) / Math.max(1, a.gearValue - current.gearValue);
          const eb = (b.buyPrice - current.buyPrice) / Math.max(1, b.gearValue - current.gearValue);
          return ea - eb;
        })[0];
      if (!alt) continue;
      moves.push({
        buyDelta: Math.max(1, alt.buyPrice - current.buyPrice),
        gearDelta: alt.gearValue - current.gearValue,
        apply: () => {
          used.delete(current.id);
          used.add(alt.id);
          kit[slot.id] = alt.id;
        },
      });
    }

    const needed = budget - gearOf();
    const best = moves
      .filter((m) => m.gearDelta > 0)
      .sort((a, b) => {
        const aOver = a.gearDelta >= needed ? 0 : 1;
        const bOver = b.gearDelta >= needed ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return a.buyDelta / a.gearDelta - b.buyDelta / b.gearDelta;
      })[0];
    if (!best) break;
    best.apply();
  }

  for (const slot of LOADOUT_SLOTS) {
    const currentId = kit[slot.id];
    const current = combat.find((i) => i.id === currentId);
    if (!current) continue;
    const cheaper = pool(combat, slot.categories, used)
      .filter((i) => i.buyPrice < current.buyPrice)
      .sort((a, b) => b.gearValue - a.gearValue || a.buyPrice - b.buyPrice);
    for (const alt of cheaper) {
      const next = { ...kit, [slot.id]: alt.id };
      if (over(next).gear >= budget) {
        used.delete(current.id);
        used.add(alt.id);
        kit[slot.id] = alt.id;
        break;
      }
    }
  }

  return kit;
}

export const autoFillKit = autoFillCheapest;

export function kitToEntries(slots: KitSlots): { slot: string; itemId: string }[] {
  return Object.entries(slots)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([slot, itemId]) => ({ slot, itemId }));
}
