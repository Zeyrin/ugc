import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { Kpi, card, date, num, type Stats } from "@/lib/ui";

type P = { caption: string | null; post_url: string | null; published_at: string; stats: Stats; platform: string | null; handle: string | null };

export default async function Report({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await (await db()).rpc("report_get", { p_token: token });
  if (!data) notFound();
  const posts = data.posts as P[];
  const sum = (k: keyof Stats) => num(posts.reduce((t, p) => t + (p.stats[k] ?? 0), 0));
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="text-2xl font-semibold">{data.org} — résultats</h1>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Publications" value={String(posts.length)} />
        <Kpi label="Vues" value={sum("impressions")} />
        <Kpi label="Likes" value={sum("likes")} />
        <Kpi label="Partages" value={sum("shares")} />
      </section>
      <ul className={`${card} divide-y text-sm`}>
        {posts.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-4 p-3">
            <div className="min-w-0">
              <p className="truncate">{p.caption || "Vidéo"}</p>
              <p className="text-xs text-neutral-500">{p.platform} {p.handle} · {date(p.published_at)}</p>
            </div>
            <span className="shrink-0">{num(p.stats.impressions)} vues</span>
            {p.post_url && <a href={p.post_url} target="_blank" className="shrink-0 text-sky-700 underline">Voir</a>}
          </li>
        ))}
      </ul>
    </main>
  );
}
