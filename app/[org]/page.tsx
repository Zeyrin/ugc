import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, type Role } from "@/lib/supabase";

type Stat = { impressions: number; likes: number; comments: number; shares: number };

async function addMission(form: FormData) {
  "use server";
  const org = String(form.get("org"));
  const { error } = await (await db()).from("missions").insert({
    org_id: org,
    title: String(form.get("title")),
    creator_id: form.get("creator") || null,
    due_at: form.get("due") || null,
  });
  if (error) throw error;
  revalidatePath(`/${org}`);
}

async function invite(form: FormData) {
  "use server";
  const org = String(form.get("org"));
  const { error } = await (await db()).rpc("invite_member", {
    org,
    member_email: String(form.get("email")),
    member_role: String(form.get("role")),
  });
  if (error) throw error;
  revalidatePath(`/${org}`);
}

export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const supabase = await db();
  const { data: role } = await supabase.rpc("role_in", { org });
  if (!role) notFound();
  const staff = role !== "creator";

  const [{ data: missions }, { data: posts }, { data: members }] = await Promise.all([
    supabase.from("missions").select("id, title, status, due_at, creator_id").eq("org_id", org).order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select("id, caption, status, scheduled_at, post_stats(impressions, likes, comments, shares)")
      .eq("org_id", org)
      .order("created_at", { ascending: false })
      .order("collected_at", { referencedTable: "post_stats", ascending: false })
      .limit(1, { referencedTable: "post_stats" }),
    staff ? supabase.from("members").select("user_id, email, role").eq("org_id", org) : Promise.resolve({ data: [] }),
  ]);

  const total = (posts ?? []).reduce(
    (t, p) => {
      const s = (p.post_stats as Stat[])[0];
      if (s) (Object.keys(t) as (keyof Stat)[]).forEach((k) => (t[k] += s[k]));
      return t;
    },
    { impressions: 0, likes: 0, comments: 0, shares: 0 },
  );
  const creators = (members ?? []).filter((m) => m.role === "creator");

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500">← Espaces</Link>
        <span className="rounded bg-neutral-200 px-2 py-1 text-xs">{role as Role}</span>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(total).map(([k, v]) => (
          <div key={k} className="rounded border bg-white p-3">
            <p className="text-xs text-neutral-500">{k}</p>
            <p className="text-xl font-semibold">{v.toLocaleString("fr")}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Missions</h2>
        {staff && (
          <form action={addMission} className="flex flex-wrap gap-2">
            <input type="hidden" name="org" value={org} />
            <input name="title" required placeholder="Titre" className="flex-1 rounded border p-2" />
            <select name="creator" className="rounded border p-2">
              <option value="">Non assignée</option>
              {creators.map((c) => <option key={c.user_id} value={c.user_id}>{c.email}</option>)}
            </select>
            <input name="due" type="date" className="rounded border p-2" />
            <button className="rounded bg-black px-4 text-white">Ajouter</button>
          </form>
        )}
        <ul className="divide-y rounded border bg-white">
          {missions?.map((m) => (
            <li key={m.id} className="flex justify-between p-3">
              {m.title}
              <span className="text-sm text-neutral-500">{m.status}{m.due_at && ` · ${new Date(m.due_at).toLocaleDateString("fr")}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Publications</h2>
        <ul className="divide-y rounded border bg-white">
          {posts?.map((p) => (
            <li key={p.id} className="flex justify-between gap-4 p-3">
              <span className="truncate">{p.caption || "Sans légende"}</span>
              <span className="shrink-0 text-sm text-neutral-500">{p.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {staff && (
        <section className="space-y-3">
          <h2 className="font-semibold">Membres</h2>
          <ul className="divide-y rounded border bg-white">
            {members?.map((m) => (
              <li key={m.user_id} className="flex justify-between p-3">
                {m.email}
                <span className="text-sm text-neutral-500">{m.role}</span>
              </li>
            ))}
          </ul>
          <form action={invite} className="flex gap-2">
            <input type="hidden" name="org" value={org} />
            <input name="email" type="email" required placeholder="Email" className="flex-1 rounded border p-2" />
            <select name="role" className="rounded border p-2">
              <option value="creator">creator</option>
              {role === "owner" && <option value="manager">manager</option>}
              {role === "owner" && <option value="owner">owner</option>}
            </select>
            <button className="rounded bg-black px-4 text-white">Inviter</button>
          </form>
        </section>
      )}
    </main>
  );
}
