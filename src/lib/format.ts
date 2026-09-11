export function formatHaf(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10000) {
    const wan = value / 10000;
    const text = Number.isInteger(wan) ? String(wan) : wan.toFixed(digits).replace(/\.?0+$/, "");
    return `${text}万`;
  }
  return Math.round(value).toLocaleString("zh-CN");
}

export function formatKg(value: number): string {
  return `${value.toFixed(1)} kg`;
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function clampText(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}
