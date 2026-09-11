export function cleanText(value: unknown, min: number, max: number, label: string): string {
  if (typeof value !== "string") throw new Error(`${label}不能为空`);
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < min || text.length > max) {
    throw new Error(`${label}长度需在 ${min}–${max} 字之间`);
  }
  return text;
}

export function asInt(value: unknown, label: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label}无效`);
  return Math.round(n);
}
