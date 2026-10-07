import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";

async function createOrg(form: FormData) {
  "use server";
  const { data, error } = await (await db()).rpc("create_organization", { org_name: String(form.get("name")) });
  if (error) throw error;
  redirect(`/${data}`);
}

export default async function Home() {
  const { data: orgs } = await (await db()).from("members").select("role, organizations(id, name)");
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Espaces</h1>
      <ul className="divide-y rounded border bg-white">
        {orgs?.map((m) => {
          const o = m.organizations as unknown as { id: string; name: string };
          return (
            <li key={o.id}>
              <Link href={`/${o.id}`} className="flex justify-between p-3 hover:bg-neutral-100">
                {o.name}
                <span className="text-sm text-neutral-500">{m.role}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={createOrg} className="flex gap-2">
        <input name="name" required placeholder="Nouvel espace" className="flex-1 rounded border p-2" />
        <button className="rounded bg-black px-4 text-white">Créer</button>
      </form>
    </main>
  );
}
