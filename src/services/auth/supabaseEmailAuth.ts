import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseEmailAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseEmailAuthConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

const getSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase email auth is not configured.");
  }

  return supabase;
};

export const sendVerificationEmailLink = async (email: string, shouldCreateUser: boolean) => {
  const client = getSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
      emailRedirectTo: `${window.location.origin}/sign-in`,
    },
  });

  if (error) {
    throw error;
  }
};

export const getCurrentEmailAuthSession = async () => {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
};

export const onEmailAuthStateChange = (callback: (session: Session | null) => void) => {
  if (!supabase) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
};
