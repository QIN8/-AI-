export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "三角洲资料站";
export const SITE_TAGLINE = "卡战备 · 装备物价 · 地图攻略 · 轻论坛";

export const BUDGET_TIERS = [
  {
    id: "11w",
    label: "11.25万",
    budget: 112500,
    maps: "大坝机密 / 长弓机密",
  },
  {
    id: "18w",
    label: "18.75万",
    budget: 187500,
    maps: "巴克什·航天机密 / 永夜大坝",
  },
  {
    id: "55w",
    label: "55万",
    budget: 550000,
    maps: "巴克什绝密",
  },
  {
    id: "60w",
    label: "60万",
    budget: 600000,
    maps: "航天绝密",
  },
  {
    id: "78w",
    label: "78万",
    budget: 780000,
    maps: "潮汐监狱绝密",
  },
] as const;

export const ITEM_CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "gun", label: "枪械" },
  { id: "helmet", label: "头盔" },
  { id: "armor", label: "护甲" },
  { id: "bag", label: "背包" },
  { id: "chest_rig", label: "胸挂" },
  { id: "med", label: "医疗" },
  { id: "accessory", label: "配件" },
] as const;

export const LOADOUT_SLOTS = [
  { id: "primary", label: "主武器", categories: ["gun"] },
  { id: "secondary", label: "副武器", categories: ["gun"] },
  { id: "helmet", label: "头盔", categories: ["helmet"] },
  { id: "armor", label: "护甲", categories: ["armor"] },
  { id: "bag", label: "背包", categories: ["bag"] },
  { id: "chest", label: "胸挂", categories: ["chest_rig"] },
  { id: "med1", label: "医疗 A", categories: ["med"] },
  { id: "med2", label: "医疗 B", categories: ["med"] },
  { id: "extra-1", label: "配件 / 特殊", categories: ["accessory"] },
  { id: "extra-2", label: "配件 / 特殊 2", categories: ["accessory"] },
  { id: "extra-3", label: "配件 / 特殊 3", categories: ["accessory"] },
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
  med: "医疗",
  accessory: "配件",
};

export const NAV = [
  { href: "/", label: "首页" },
  { href: "/loadout", label: "卡战备" },
  { href: "/items", label: "装备物价" },
  { href: "/maps", label: "地图" },
  { href: "/guides", label: "攻略" },
  { href: "/forum", label: "论坛" },
];
