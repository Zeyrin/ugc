import { ctx } from "@/lib/supabase";
import { createPost } from "@/lib/actions";
import PostForm from "@/components/PostForm";

export default async function NewPost({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { supabase, staff } = await ctx(org);
  const [{ data: missions }, { data: accounts }] = await Promise.all([
    supabase.from("missions").select("id, title").eq("org_id", org).in("status", ["open", "in_progress"]),
    staff ? supabase.from("social_accounts").select("id, platform, handle").eq("org_id", org) : Promise.resolve({ data: null }),
  ]);
  if (!staff && !missions?.length) return <p className="text-neutral-500">Aucune mission en cours. Demandez à votre manager de vous en assigner une.</p>;
  return (
    <>
      <h1 className="text-xl font-semibold">Nouvelle vidéo</h1>
      <PostForm
        org={org}
        action={createPost}
        missions={(missions ?? []).map((m) => ({ id: m.id, label: m.title }))}
        accounts={accounts && accounts.map((a) => ({ id: a.id, label: `${a.platform} · ${a.handle}` }))}
      />
    </>
  );
}
