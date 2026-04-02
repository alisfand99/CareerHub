import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * One Supabase auth read per RSC request tree (dedupes layout + parallel pages).
 */
export const getCachedUserEmail = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
});
