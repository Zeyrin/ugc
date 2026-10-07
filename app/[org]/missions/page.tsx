import { ctx } from "@/lib/supabase";
import { addMission, setMission } from "@/lib/actions";
import { Kpi, btn, card, date, eur, field, gain, num, type Stats } from "@/lib/ui";

const MS = { open: "Ouverte", in_progress: "En cours", submitted: "Livrée", done: "Terminée", cancelled: "Annulée" };

export default async function Missions({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { supabase, staff } = await ctx(org);
  const [{ data: missions }, { data: members }] = await Promise.all([
    supabase.from("missions").select("*, posts(status, stats)").eq("org_id", org).order("created_at", { ascending: false }),
    staff ? supabase.from("members").select("user_id, email, role").eq("org_id", org) : Promise.resolve({ data: [] }),
  ]);
  const who = (id: string | null) => members?.find((m) => m.user_id === id)?.email ?? "—";
  const rows = (missions ?? []).map((m) => {
    const views = m.posts.reduce((t: number, p: { stats: Stats }) => t + (p.stats.impressions ?? 0), 0);
    return { ...m, views, earned: m.status === "cancelled" ? 0 : gain(m, views) };
  });
  const total = rows.reduce((t, r) => t + r.earned, 0);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi label={staff ? "À payer (fixe + CPM)" : "Mes gains"} value={eur(total)} />
        <Kpi label="Vues générées" value={num(rows.reduce((t, r) => t + r.views, 0))} />
        <Kpi label="Missions actives" value={String(rows.filter((r) => ["open", "in_progress"].includes(r.status)).length)} />
      </section>

      {staff && (
        <form action={addMission} className={`${card} grid gap-2 p-4 md:grid-cols-6`}>
          <input type="hidden" name="org" value={org} />
          <input name="title" required placeholder="Titre de la mission" className={`${field} md:col-span-2`} />
          <select name="creator" className={field}>
            <option value="">Créateur…</option>
            {members?.filter((m) => m.role === "creator").map((c) => <option key={c.user_id} value={c.user_id}>{c.email}</option>)}
          </select>
          <input name="due" type="date" className={field} />
          <input name="rate" type="number" min={0} step="0.01" placeholder="Fixe €" className={field} />
          <input name="cpm" type="number" min={0} step="0.01" placeholder="€ / 1000 vues" className={field} />
          <textarea name="brief" rows={2} placeholder="Brief : hook, plans, CTA, do & don't…" className={`${field} md:col-span-5`} />
          <button className={btn}>Créer</button>
        </form>
      )}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-neutral-500">
            <tr>{["Mission", staff && "Créateur", "Échéance", "Vidéos", "Vues", "Fixe / CPM", "Gain", "Statut"].filter(Boolean).map((h) => <th key={String(h)} className="p-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3"><p className="font-medium">{r.title}</p>{r.brief && <p className="line-clamp-1 text-xs text-neutral-500">{r.brief}</p>}</td>
                {staff && <td className="p-3">{who(r.creator_id)}</td>}
                <td className="p-3">{date(r.due_at)}</td>
                <td className="p-3">{r.posts.length}</td>
                <td className="p-3">{num(r.views)}</td>
                <td className="p-3">{eur(r.rate)} / {eur(r.cpm)}</td>
                <td className="p-3 font-semibold">{eur(r.earned)}</td>
                <td className="p-3">
                  {staff ? (
                    <form action={setMission} className="flex gap-1">
                      <input type="hidden" name="org" value={org} />
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status} className={field}>
                        {Object.entries(MS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                      <button className="text-xs underline">OK</button>
                    </form>
                  ) : MS[r.status as keyof typeof MS]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
