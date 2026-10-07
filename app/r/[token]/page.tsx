import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { guestReview } from "@/lib/actions";
import { Badge, date } from "@/lib/ui";
import Review from "@/components/Review";

export default async function ClientReview({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await (await db()).rpc("review_get", { p_token: token });
  if (!data) notFound();
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{data.org}</h1>
        <Badge s={data.status} />
        {data.scheduled_at && <span className="text-sm text-neutral-500">Prévu le {date(data.scheduled_at)}</span>}
      </header>
      {data.caption && <p className="whitespace-pre-wrap rounded-xl border bg-white p-3 text-sm">{data.caption}</p>}
      <Review guest media={data.media} feedback={data.feedback} action={guestReview.bind(null, token)} />
    </main>
  );
}
