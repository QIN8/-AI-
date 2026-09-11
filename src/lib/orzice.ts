export type OrziceRow = {
  id: number;
  name: string;
  price: number;
  secondClassCN: string;
  is_get_time: number;
  zbPrice?: number;
  changeRatio?: number;
};

const GUNS = new Set([
  "手枪",
  "冲锋枪",
  "步枪",
  "精确射手步枪",
  "轻机枪",
  "霰弹枪",
  "狙击步枪",
  "特殊武器",
]);

const ACCESSORIES = new Set([
  "弹匣",
  "后握把",
  "瞄具",
  "枪管",
  "枪托",
  "护木",
  "枪口",
  "前握把",
  "功能性配件",
]);

export function mapOrziceCategory(secondClassCN: string): string {
  if (secondClassCN === "头盔") return "helmet";
  if (secondClassCN === "护甲") return "armor";
  if (secondClassCN === "背包") return "bag";
  if (secondClassCN === "胸挂") return "chest_rig";
  if (secondClassCN === "消耗品") return "med";
  if (secondClassCN === "钥匙") return "key";
  if (secondClassCN === "收集品") return "loot";
  if (GUNS.has(secondClassCN)) return "gun";
  if (ACCESSORIES.has(secondClassCN)) return "accessory";
  if (/mm|Gauge|ACP|AE|Magnum|箭矢/i.test(secondClassCN)) return "ammo";
  return "loot";
}

export function inferRarity(name: string, price: number): { rarity: string; level: number } {
  if (name.includes("破损")) return { rarity: "uncommon", level: price > 200000 ? 4 : 2 };
  if (name.includes("几乎全新")) return { rarity: "rare", level: price > 200000 ? 5 : 3 };
  if (price >= 800000) return { rarity: "legendary", level: 6 };
  if (price >= 200000) return { rarity: "epic", level: 5 };
  if (price >= 50000) return { rarity: "rare", level: 4 };
  if (price >= 15000) return { rarity: "uncommon", level: 3 };
  return { rarity: "common", level: 2 };
}

export function estimatedSell(price: number): number {
  return Math.max(1, Math.round(price * 0.72));
}
