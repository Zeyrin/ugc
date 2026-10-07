import Link from "next/link";
import { ctx } from "@/lib/supabase";
import { Badge, Kpi, card, date, num, type Stats } from "@/lib/ui";

const COLS: [string, string[]][] = [
  ["À faire", ["draft", "rejected"]],
  ["À valider", ["pending_review"]],
  ["Validé", ["approved"]],
  ["Planifié", ["scheduled"]],
  ["Publié", ["published"]],
];

export default async function Board({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { supabase } = await ctx(org);
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, status, scheduled_at, published_at, stats, social_accounts(handle)")
    .eq("org_id", org)
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  const all = posts ?? [];
  const sum = (k: keyof Stats) => all.reduce((t, p) => t + ((p.stats as Stats)[k] ?? 0), 0);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="À valider" value={String(all.filter((p) => p.status === "pending_review").length)} />
        <Kpi label="Planifiées" value={String(all.filter((p) => p.status === "scheduled").length)} />
        <Kpi label="Vues" value={num(sum("impressions"))} />
        <Kpi label="Likes" value={num(sum("likes"))} />
      </section>
      <section className="grid gap-3 overflow-x-auto md:grid-cols-5">
        {COLS.map(([title, st]) => {
          const items = all.filter((p) => st.includes(p.status));
          return (
            <div key={title} className="min-w-56 space-y-2 rounded-xl bg-neutral-100 p-2">
              <h2 className="px-1 text-sm font-semibold">{title} <span className="text-neutral-400">{items.length}</span></h2>
              {items.map((p) => (
                <Link key={p.id} href={`/${org}/posts/${p.id}`} className={`${card} block space-y-1 p-3 text-sm hover:shadow`}>
                  <p className="line-clamp-2">{p.caption || "Sans légende"}</p>
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                    <span className="truncate">{(p.social_accounts as unknown as { handle: string } | null)?.handle}</span>
                    <span>{date(p.published_at ?? p.scheduled_at)}</span>
                  </div>
                  {p.status === "rejected" && <Badge s="rejected" />}
                  {p.status === "published" && <p className="text-xs">{num((p.stats as Stats).impressions)} vues</p>}
                </Link>
              ))}
            </div>
          );
        })}
      </section>
    </>
  );
}
