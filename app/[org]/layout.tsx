import Link from "next/link";
import { ctx } from "@/lib/supabase";
import { signOut } from "@/lib/actions";
import { btn } from "@/lib/ui";

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { supabase, role, staff } = await ctx(org);
  const { data } = await supabase.from("organizations").select("name").eq("id", org).single();
  const nav = [["", "Tableau"], ["/calendar", "Calendrier"], ["/missions", staff ? "Missions" : "Mes missions"], ...(staff ? [["/team", "Équipe"]] : [])];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm">
          <Link href="/" className="font-semibold">{data?.name}</Link>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{role}</span>
          <nav className="flex flex-1 gap-3">
            {nav.map(([h, l]) => <Link key={h} href={`/${org}${h}`} className="text-neutral-600 hover:text-black">{l}</Link>)}
          </nav>
          <Link href={`/${org}/posts/new`} className={btn}>+ Vidéo</Link>
          <form action={signOut}><button className="text-neutral-500">Sortir</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-4">{children}</main>
    </div>
  );
}
