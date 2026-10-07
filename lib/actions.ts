"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";

const s = (f: FormData, k: string) => (f.get(k) ? String(f.get(k)) : null);
const n = (f: FormData, k: string) => Number(f.get(k) || 0);
const iso = (v: string | null) => (v ? new Date(v).toISOString() : null);
const done = (org: string | null) => revalidatePath(`/${org}`, "layout");
async function run(q: PromiseLike<{ error: unknown }>) {
  const { error } = await q;
  if (error) throw error;
}

export async function signOut() {
  await (await db()).auth.signOut();
  redirect("/login");
}

export async function createPost(f: FormData) {
  const org = s(f, "org")!;
  const { data, error } = await (await db())
    .from("posts")
    .insert({
      org_id: org,
      caption: s(f, "caption"),
      media_urls: s(f, "media") ? [s(f, "media")] : [],
      mission_id: s(f, "mission"),
      social_account_id: s(f, "account"),
      scheduled_at: iso(s(f, "scheduled_at")),
      status: s(f, "status") ?? "draft",
    })
    .select("id")
    .single();
  if (error) throw error;
  done(org);
  redirect(`/${org}/posts/${data.id}`);
}

export async function editPost(f: FormData) {
  await run((await db()).from("posts").update({ caption: s(f, "caption"), scheduled_at: iso(s(f, "scheduled_at")) }).eq("id", s(f, "id")!));
  done(s(f, "org"));
}

export async function setStatus(f: FormData) {
  const status = s(f, "status")!;
  const patch: Record<string, unknown> = { status };
  if (s(f, "scheduled_at")) patch.scheduled_at = iso(s(f, "scheduled_at"));
  if (status === "published") Object.assign(patch, { published_at: new Date().toISOString(), post_url: s(f, "post_url") });
  await run((await db()).from("posts").update(patch).eq("id", s(f, "id")!));
  done(s(f, "org"));
}

export async function addFeedback(org: string, post: string, f: FormData) {
  if (!s(f, "body")) return;
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  await run(
    supabase.from("feedback").insert({
      post_id: post,
      author_name: data.user?.email?.split("@")[0],
      body: s(f, "body"),
      at_seconds: s(f, "at") ? n(f, "at") : null,
    }),
  );
  done(org);
}

export async function guestReview(token: string, f: FormData) {
  await run(
    (await db()).rpc("review_act", {
      p_token: token,
      p_name: s(f, "name"),
      p_body: s(f, "body"),
      p_at: s(f, "at") ? n(f, "at") : null,
      p_decision: s(f, "decision"),
    }),
  );
  revalidatePath(`/r/${token}`);
}

export async function addStats(f: FormData) {
  await run(
    (await db()).from("post_stats").insert({
      post_id: s(f, "id"),
      impressions: n(f, "impressions"),
      likes: n(f, "likes"),
      comments: n(f, "comments"),
      shares: n(f, "shares"),
    }),
  );
  done(s(f, "org"));
}

export async function addMission(f: FormData) {
  await run(
    (await db()).from("missions").insert({
      org_id: s(f, "org"),
      title: s(f, "title"),
      brief: s(f, "brief"),
      creator_id: s(f, "creator"),
      due_at: iso(s(f, "due")),
      rate: n(f, "rate"),
      cpm: n(f, "cpm"),
    }),
  );
  done(s(f, "org"));
}

export async function setMission(f: FormData) {
  await run((await db()).from("missions").update({ status: s(f, "status") }).eq("id", s(f, "id")!));
  done(s(f, "org"));
}

export async function invite(f: FormData) {
  await run((await db()).rpc("invite_member", { org: s(f, "org"), member_email: s(f, "email"), member_role: s(f, "role") }));
  done(s(f, "org"));
}

export async function addAccount(f: FormData) {
  await run((await db()).from("social_accounts").insert({ org_id: s(f, "org"), platform: s(f, "platform"), handle: s(f, "handle") }));
  done(s(f, "org"));
}
