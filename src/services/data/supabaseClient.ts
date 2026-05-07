/**
 * Shared Supabase client instance.
 * Re-uses the same configuration as the auth module but exports it
 * for use in data operations (CRUD against Postgres tables).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (_client) return _client;

  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  _client = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return _client;
};

/** Convenience: get the currently-signed-in user's ID, or null. */
export const getCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;

  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();

  return user?.id ?? null;
};
