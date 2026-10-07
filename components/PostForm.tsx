"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { btn, btn2, field } from "@/lib/ui";

type Opt = { id: string; label: string };

export default function PostForm({ org, missions, accounts, action }: {
  org: string;
  missions: Opt[];
  accounts: Opt[] | null;
  action: (f: FormData) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const path = `${org}/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const { error } = await sb.storage.from("media").upload(path, file);
    if (error) setErr(error.message);
    else setUrl(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }

  return (
    <form action={action} className="grid gap-6 md:grid-cols-2">
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="media" value={url} />
      <label className="relative grid min-h-80 place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-white text-sm text-neutral-500">
        {url ? <video src={url} controls className="max-h-[70vh] w-full bg-black" /> : busy ? "Envoi…" : "Glissez la vidéo ici ou cliquez"}
        <input type="file" accept="video/*,image/*" onChange={(e) => upload(e.target.files?.[0])} className="absolute inset-0 cursor-pointer opacity-0" hidden={!!url} />
      </label>
      <div className="flex flex-col gap-3">
        {err && <p className="text-sm text-red-600">{err}</p>}
        <textarea name="caption" rows={6} placeholder="Légende, hashtags…" className={field} />
        <select name="mission" required={!accounts} className={field}>
          {accounts && <option value="">Sans mission</option>}
          {missions.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {accounts && (
          <select name="account" className={field}>
            <option value="">Compte cible…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        )}
        <label className="text-xs text-neutral-500">
          Date souhaitée
          <input type="datetime-local" name="scheduled_at" className={`${field} mt-1 w-full`} />
        </label>
        <div className="flex gap-2">
          <button name="status" value="draft" disabled={busy} className={btn2}>Brouillon</button>
          <button name="status" value="pending_review" disabled={busy || !url} className={btn}>Envoyer en validation</button>
        </div>
      </div>
    </form>
  );
}
