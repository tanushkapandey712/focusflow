/**
 * Supabase email auth — uses the shared client from supabaseClient.ts.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../data/supabaseClient";

export const isSupabaseEmailAuthConfigured = isSupabaseConfigured;

export const sendVerificationEmailLink = async (email: string, shouldCreateUser: boolean) => {
  const client = getSupabaseClient();
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
  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw error;
  }

  return session;
};

export const onEmailAuthStateChange = (callback: (session: Session | null) => void) => {
  if (!isSupabaseConfigured) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
};

export const signOut = async () => {
  if (!isSupabaseConfigured) return;
  await getSupabaseClient().auth.signOut();
};
