import { RARITY_LABEL } from "@/lib/constants";

const rarityClass: Record<string, string> = {
  common: "border-white/20 text-sand/70",
  uncommon: "border-olive/50 text-olive",
  rare: "border-sky-400/40 text-sky-300",
  epic: "border-violet-400/40 text-violet-300",
  legendary: "border-gold/50 text-gold",
};

export function ItemBadge({ rarity, level }: { rarity: string; level: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] ${rarityClass[rarity] ?? rarityClass.common}`}
    >
      {level}级 · {RARITY_LABEL[rarity] ?? rarity}
    </span>
  );
}
