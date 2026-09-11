export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "三角洲资料站";
export const SITE_TAGLINE = "卡战备 · 装备物价 · 地图攻略 · 轻论坛";

export const OFFICIAL_MAP_TOOL = "https://df.qq.com/cp/a20240729directory/";
export const ORZICE_PRICE_URL = "https://raw.githubusercontent.com/orzice/DeltaForcePrice/master/price.json";
export const ORZICE_REPO = "https://github.com/orzice/DeltaForcePrice";

export const BUDGET_TIERS = [
  { id: "11w", label: "11万", budget: 110000, maps: "大坝机密 / 长弓机密" },
  { id: "18w", label: "18.75万", budget: 187500, maps: "巴克什机密 / 航天机密 / 永夜大坝" },
  { id: "58w", label: "58万", budget: 580000, maps: "巴克什绝密" },
  { id: "60w", label: "60万", budget: 600000, maps: "航天绝密" },
  { id: "78w", label: "78万", budget: 780000, maps: "潮汐监狱绝密" },
] as const;

export const ITEM_CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "gun", label: "枪械" },
  { id: "helmet", label: "头盔" },
  { id: "armor", label: "护甲" },
  { id: "bag", label: "背包" },
  { id: "chest_rig", label: "胸挂" },
  { id: "ammo", label: "弹药" },
  { id: "med", label: "消耗品" },
  { id: "accessory", label: "配件" },
  { id: "key", label: "钥匙" },
  { id: "loot", label: "收集品" },
] as const;

export const LOADOUT_SLOTS = [
  { id: "primary", label: "主武器", categories: ["gun"], essential: true },
  { id: "secondary", label: "副武器", categories: ["gun"], essential: false },
  { id: "helmet", label: "头盔", categories: ["helmet"], essential: true },
  { id: "armor", label: "护甲", categories: ["armor"], essential: true },
  { id: "bag", label: "背包", categories: ["bag"], essential: true },
  { id: "chest", label: "胸挂", categories: ["chest_rig"], essential: true },
  { id: "ammo", label: "弹药", categories: ["ammo"], essential: false },
  { id: "med1", label: "消耗品", categories: ["med"], essential: false },
  { id: "extra-1", label: "配件 A", categories: ["accessory"], essential: false },
  { id: "extra-2", label: "配件 B", categories: ["accessory"], essential: false },
  { id: "extra-3", label: "配件 C", categories: ["accessory"], essential: false },
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
  helmet: "头盔",
  armor: "护甲",
  bag: "背包",
  chest_rig: "胸挂",
  ammo: "弹药",
  med: "消耗品",
  accessory: "配件",
  key: "钥匙",
  loot: "收集品",
};

export const NAV = [
  { href: "/", label: "首页" },
  { href: "/loadout", label: "卡战备" },
  { href: "/items", label: "装备物价" },
  { href: "/maps", label: "地图" },
  { href: "/guides", label: "攻略" },
  { href: "/forum", label: "论坛" },
];
