import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  missingSupabaseEnvMessage,
} from "./env";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(missingSupabaseEnvMessage);
  }
  return createBrowserClient(url, key);
}
