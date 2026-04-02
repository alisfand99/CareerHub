export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Prefix kept for code that detects this error; remainder is user-facing. */
export const missingSupabaseEnvMessage =
  "MISSING_SUPABASE_ENV: This app is not connected to your account storage. If you manage the deployment, add your database settings in the hosting console and publish again.";
