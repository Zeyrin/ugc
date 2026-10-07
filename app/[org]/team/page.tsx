import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ctx } from "@/lib/supabase";
import { addAccount, invite } from "@/lib/actions";
import { btn, card, field } from "@/lib/ui";

const PLATFORMS = ["instagram", "tiktok", "youtube", "linkedin", "x", "facebook"];

export default async function Team({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { supabase, role, staff } = await ctx(org);
  if (!staff) notFound();
  const [{ data: members }, { data: accounts }, { data: o }] = await Promise.all([
    supabase.from("members").select("user_id, email, role").eq("org_id", org),
    supabase.from("social_accounts").select("id, platform, handle").eq("org_id", org),
    supabase.from("organizations").select("report_token").eq("id", org).single(),
  ]);
  const host = (await headers()).get("host");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className={`${card} space-y-3 p-4`}>
        <h2 className="font-semibold">Membres</h2>
        <ul className="divide-y text-sm">
          {members?.map((m) => <li key={m.user_id} className="flex justify-between py-2">{m.email}<span className="text-neutral-500">{m.role}</span></li>)}
        </ul>
        <form action={invite} className="flex gap-2">
          <input type="hidden" name="org" value={org} />
          <input name="email" type="email" required placeholder="Email (compte existant)" className={`${field} flex-1`} />
          <select name="role" className={field}>
            <option value="creator">creator</option>
            {role === "owner" && <option value="manager">manager</option>}
            {role === "owner" && <option value="owner">owner</option>}
          </select>
          <button className={btn}>Ajouter</button>
        </form>
      </section>

      <section className={`${card} space-y-3 p-4`}>
        <h2 className="font-semibold">Comptes gérés</h2>
        <ul className="divide-y text-sm">
          {accounts?.map((a) => <li key={a.id} className="flex justify-between py-2">{a.handle}<span className="text-neutral-500">{a.platform}</span></li>)}
        </ul>
        <form action={addAccount} className="flex gap-2">
          <input type="hidden" name="org" value={org} />
          <select name="platform" className={field}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
          <input name="handle" required placeholder="@compte" className={`${field} flex-1`} />
          <button className={btn}>Ajouter</button>
        </form>
      </section>

      <section className={`${card} space-y-2 p-4 md:col-span-2`}>
        <h2 className="font-semibold">Rapport client</h2>
        <p className="text-sm text-neutral-500">Lien public, sans compte : publications et stats à jour.</p>
        <input readOnly value={`https://${host}/report/${o?.report_token}`} className={`${field} w-full font-mono`} />
      </section>
    </div>
  );
}
