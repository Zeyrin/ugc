import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ctx } from "@/lib/supabase";
import { addFeedback, addStats, editPost, setStatus } from "@/lib/actions";
import { Badge, btn, btn2, card, date, field, num, type Stats } from "@/lib/ui";
import Review from "@/components/Review";

const local = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export default async function Post({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  const { supabase, staff } = await ctx(org);
  const { data: p } = await supabase
    .from("posts")
    .select("*, feedback(author_name, body, at_seconds, created_at), missions(title, brief), social_accounts(platform, handle)")
    .eq("id", id)
    .order("created_at", { referencedTable: "feedback" })
    .single();
  if (!p) notFound();
  const host = (await headers()).get("host");
  const stats = p.stats as Stats;
  const editable = staff || ["draft", "rejected", "pending_review"].includes(p.status);
  const hidden = (
    <>
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="id" value={id} />
    </>
  );
  const go = (status: string, label: string, cls = btn2) => (
    <form action={setStatus}>{hidden}<button name="status" value={status} className={cls}>{label}</button></form>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge s={p.status} />
        <span className="text-sm text-neutral-500">
          {p.missions?.title}{p.social_accounts && ` · ${p.social_accounts.platform} ${p.social_accounts.handle}`}
        </span>
        {p.post_url && <a href={p.post_url} target="_blank" className="text-sm text-sky-700 underline">Voir le post</a>}
      </div>
      {p.missions?.brief && <p className={`${card} whitespace-pre-wrap p-3 text-sm text-neutral-700`}>{p.missions.brief}</p>}

      <Review media={p.media_urls} feedback={p.feedback} action={addFeedback.bind(null, org, id)} />

      <section className="grid gap-4 md:grid-cols-2">
        <form action={editPost} className={`${card} flex flex-col gap-2 p-4`}>
          {hidden}
          <h2 className="font-semibold">Publication</h2>
          <textarea name="caption" rows={5} defaultValue={p.caption ?? ""} disabled={!editable} className={field} />
          <input type="datetime-local" name="scheduled_at" defaultValue={local(p.scheduled_at)} disabled={!editable} className={field} />
          {editable && <button className={btn2}>Enregistrer</button>}
        </form>

        <div className={`${card} flex flex-col gap-3 p-4`}>
          <h2 className="font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {["draft", "rejected"].includes(p.status) && go("pending_review", "Envoyer en validation", btn)}
            {staff && p.status === "pending_review" && go("approved", "Valider", btn)}
            {staff && p.status === "pending_review" && go("rejected", "Demander des modifs")}
            {staff && p.status === "approved" && go("scheduled", "Marquer planifiée", btn)}
          </div>
          {staff && ["approved", "scheduled"].includes(p.status) && (
            <form action={setStatus} className="flex gap-2">
              {hidden}
              <input name="post_url" type="url" placeholder="URL du post publié" className={`${field} flex-1`} />
              <button name="status" value="published" className={btn}>Publié</button>
            </form>
          )}
          {staff && (
            <label className="text-xs text-neutral-500">
              Lien de validation client (sans compte)
              <input readOnly value={`https://${host}/r/${p.review_token}`} className={`${field} mt-1 w-full font-mono`} />
            </label>
          )}
        </div>
      </section>

      {p.status === "published" && (
        <section className={`${card} space-y-3 p-4`}>
          <h2 className="font-semibold">Stats {p.published_at && <span className="text-sm font-normal text-neutral-500">publié le {date(p.published_at)}</span>}</h2>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {(["impressions", "likes", "comments", "shares"] as const).map((k) => (
              <div key={k}><p className="text-lg font-semibold">{num(stats[k])}</p><p className="text-xs text-neutral-500">{k}</p></div>
            ))}
          </div>
          {staff && (
            <form action={addStats} className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {hidden}
              {(["impressions", "likes", "comments", "shares"] as const).map((k) => (
                <input key={k} name={k} type="number" min={0} placeholder={k} defaultValue={stats[k]} className={field} />
              ))}
              <button className={btn}>Mettre à jour</button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
