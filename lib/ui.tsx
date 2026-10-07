export const btn = "rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40";
export const btn2 = "rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-100";
export const field = "rounded-lg border bg-white p-2 text-sm";
export const card = "rounded-xl border bg-white";

export const STATUS: Record<string, [string, string]> = {
  draft: ["Brouillon", "bg-neutral-100 text-neutral-700"],
  pending_review: ["À valider", "bg-amber-100 text-amber-800"],
  approved: ["Validé", "bg-emerald-100 text-emerald-800"],
  scheduled: ["Planifié", "bg-sky-100 text-sky-800"],
  published: ["Publié", "bg-violet-100 text-violet-800"],
  rejected: ["À refaire", "bg-red-100 text-red-800"],
};

export type Stats = { impressions?: number; likes?: number; comments?: number; shares?: number };

export const num = (n = 0) => n.toLocaleString("fr", { notation: "compact" });
export const eur = (n = 0) => n.toLocaleString("fr", { style: "currency", currency: "EUR" });
export const date = (d?: string | null) =>
  d ? new Date(d).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
export const gain = (m: { rate: number; cpm: number }, views: number) => Number(m.rate) + (Number(m.cpm) * views) / 1000;

export function Badge({ s }: { s: string }) {
  const [label, cls] = STATUS[s] ?? [s, "bg-neutral-100"];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
