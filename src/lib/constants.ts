export { BUDGET_TIERS, MAP_THRESHOLDS, nearestTier } from "@/lib/thresholds";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "三角洲资料站";
export const SITE_TAGLINE = "卡战备 · 装备物价 · 地图攻略 · 轻论坛";

export const OFFICIAL_MAP_TOOL = "https://df.qq.com/cp/a20240729directory/";
export const ORZICE_PRICE_URL = "https://raw.githubusercontent.com/orzice/DeltaForcePrice/master/price.json";
export const ORZICE_REPO = "https://github.com/orzice/DeltaForcePrice";
export const ORZICE_SITE = "https://orzice.com/v/zb_diy";

export const ITEM_CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "gun", label: "枪械" },
  { id: "pistol", label: "手枪" },
  { id: "helmet", label: "头盔" },
  { id: "armor", label: "护甲" },
  { id: "bag", label: "背包" },
  { id: "chest_rig", label: "胸挂" },
  { id: "ammo", label: "弹药" },
  { id: "med", label: "消耗品" },
  { id: "accessory", label: "配件" },
  { id: "key", label: "钥匙" },
  { id: "loot", label: "收集品/兑换" },
] as const;

/** 对齐 orzice /v/zb_diy：枪+配件、头、甲、胸挂、包、手枪、兑换；全部允许空槽。 */
export const LOADOUT_SLOTS = [
  { id: "primary", label: "主武器", categories: ["gun"], preferred: true },
  { id: "attach-1", label: "配件 · 瞄具", categories: ["accessory"], preferred: false },
  { id: "attach-2", label: "配件 · 枪口", categories: ["accessory"], preferred: false },
  { id: "attach-3", label: "配件 · 其他", categories: ["accessory"], preferred: false },
  { id: "helmet", label: "头盔", categories: ["helmet"], preferred: true },
  { id: "armor", label: "护甲", categories: ["armor"], preferred: true },
  { id: "chest", label: "胸挂", categories: ["chest_rig"], preferred: true },
  { id: "bag", label: "背包", categories: ["bag"], preferred: true },
  { id: "pistol", label: "手枪", categories: ["pistol"], preferred: false },
  { id: "exchange", label: "兑换物", categories: ["loot"], preferred: false },
  { id: "ammo", label: "弹药", categories: ["ammo"], preferred: false },
  { id: "med1", label: "消耗品", categories: ["med"], preferred: false },
] as const;

export const RARITY_LABEL: Record<string, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export const CATEGORY_LABEL: Record<string, string> = {
  gun: "枪械",
  pistol: "手枪",
  helmet: "头盔",
  armor: "护甲",
  bag: "背包",
  chest_rig: "胸挂",
  ammo: "弹药",
  med: "消耗品",
  accessory: "配件",
  key: "钥匙",
  loot: "收集品/兑换",
};

export const NAV = [
  { href: "/", label: "首页" },
  { href: "/loadout", label: "卡战备" },
  { href: "/items", label: "装备物价" },
  { href: "/maps", label: "地图" },
  { href: "/guides", label: "攻略" },
  { href: "/forum", label: "论坛" },
];
