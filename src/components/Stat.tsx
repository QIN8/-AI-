export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "gold" | "ok" | "danger";
}) {
  const color =
    tone === "gold"
      ? "text-gold"
      : tone === "ok"
        ? "text-olive"
        : tone === "danger"
          ? "text-danger"
          : "text-sand";

  return (
    <div className="rounded-sm border border-line bg-elev px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg ${color}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
