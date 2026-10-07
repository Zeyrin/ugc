import { cache } from "react";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type Role = "owner" | "manager" | "creator";

export async function db() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      },
    },
  });
}

export const ctx = cache(async (org: string) => {
  const supabase = await db();
  const { data: role } = await supabase.rpc("role_in", { org });
  if (!role) notFound();
  return { supabase, role: role as Role, staff: role !== "creator" };
});
