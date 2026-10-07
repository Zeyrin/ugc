import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";

async function auth(form: FormData) {
  "use server";
  const supabase = await db();
  const creds = { email: String(form.get("email")), password: String(form.get("password")) };
  const { error } =
    form.get("mode") === "signup" ? await supabase.auth.signUp(creds) : await supabase.auth.signInWithPassword(creds);
  if (error) redirect(`/login?e=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <form action={auth} className="mx-auto mt-24 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      {e && <p className="text-sm text-red-600">{e}</p>}
      <input name="email" type="email" required placeholder="Email" className="rounded border p-2" />
      <input name="password" type="password" required minLength={6} placeholder="Mot de passe" className="rounded border p-2" />
      <button name="mode" value="signin" className="rounded bg-black p-2 text-white">Se connecter</button>
      <button name="mode" value="signup" className="rounded border p-2">Créer un compte</button>
    </form>
  );
}
