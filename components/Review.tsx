"use client";
import { useRef } from "react";
import { btn, btn2, field } from "@/lib/ui";

type F = { author_name: string | null; body: string; at_seconds: number | null; created_at: string };
const tc = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function Review({ media, feedback, action, guest }: {
  media: string[];
  feedback: F[];
  action: (f: FormData) => Promise<void>;
  guest?: boolean;
}) {
  const v = useRef<HTMLVideoElement>(null);
  const at = useRef<HTMLInputElement>(null);
  const seek = (s: number) => {
    if (!v.current) return;
    v.current.currentTime = s;
    v.current.play();
  };
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
      {media[0] ? (
        <video
          ref={v}
          src={media[0]}
          controls
          playsInline
          onTimeUpdate={(e) => at.current && (at.current.value = String(e.currentTarget.currentTime))}
          className="max-h-[75vh] w-full rounded-xl bg-black"
        />
      ) : (
        <div className="grid aspect-video place-items-center rounded-xl bg-neutral-200 text-sm text-neutral-500">Pas de média</div>
      )}
      <div className="flex flex-col gap-3">
        <ul className="max-h-[55vh] flex-1 space-y-2 overflow-auto">
          {feedback.map((f, i) => (
            <li key={i} className="rounded-lg border bg-white p-2 text-sm">
              {f.at_seconds != null && (
                <button type="button" onClick={() => seek(f.at_seconds!)} className="mr-2 font-mono text-xs text-sky-700 hover:underline">
                  {tc(f.at_seconds)}
                </button>
              )}
              <span className="font-medium">{f.author_name ?? "Équipe"}</span>
              <p className="whitespace-pre-wrap text-neutral-700">{f.body}</p>
            </li>
          ))}
          {!feedback.length && <li className="text-sm text-neutral-500">Aucun retour. Mettez la vidéo en pause et commentez : le timecode est ajouté.</li>}
        </ul>
        <form action={action} className="flex flex-col gap-2">
          <input ref={at} type="hidden" name="at" />
          {guest && <input name="name" placeholder="Votre nom" className={field} />}
          <textarea name="body" rows={3} placeholder="Retour au timecode actuel…" className={field} onFocus={() => v.current?.pause()} />
          <div className="flex flex-wrap gap-2">
            <button className={btn2}>Commenter</button>
            {guest && (
              <>
                <button name="decision" value="approved" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Valider</button>
                <button name="decision" value="rejected" className={btn}>Demander des modifs</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
