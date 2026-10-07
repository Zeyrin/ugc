import Link from "next/link";
import { ctx } from "@/lib/supabase";
import { STATUS, btn2 } from "@/lib/ui";

export default async function Calendar({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ m?: string }> }) {
  const { org } = await params;
  const { m } = await searchParams;
  const { supabase } = await ctx(org);
  const start = m ? new Date(`${m}-01T00:00:00Z`) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const [a, b] = [start.toISOString(), end.toISOString()];
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, status, scheduled_at, published_at")
    .eq("org_id", org)
    .or(`and(scheduled_at.gte.${a},scheduled_at.lt.${b}),and(published_at.gte.${a},published_at.lt.${b})`);

  const lead = (start.getUTCDay() + 6) % 7;
  const days = Math.round((end.getTime() - start.getTime()) / 864e5);
  const ym = (d: Date) => d.toISOString().slice(0, 7);
  const nav = (k: number) => ym(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + k, 1)));

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={`?m=${nav(-1)}`} className={btn2}>←</Link>
        <h1 className="flex-1 text-center text-lg font-semibold capitalize">
          {start.toLocaleDateString("fr", { month: "long", year: "numeric", timeZone: "UTC" })}
        </h1>
        <Link href={`?m=${nav(1)}`} className={btn2}>→</Link>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-neutral-200 text-xs">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} className="bg-neutral-50 p-2 font-medium">{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`x${i}`} className="bg-neutral-50" />)}
        {Array.from({ length: days }, (_, i) => {
          const items = (posts ?? []).filter((p) => new Date(p.published_at ?? p.scheduled_at).getUTCDate() === i + 1);
          return (
            <div key={i} className="min-h-24 space-y-1 bg-white p-1">
              <p className="text-neutral-400">{i + 1}</p>
              {items.map((p) => (
                <Link key={p.id} href={`/${org}/posts/${p.id}`} className={`block truncate rounded px-1 ${STATUS[p.status][1]}`}>
                  {p.caption || "Vidéo"}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
