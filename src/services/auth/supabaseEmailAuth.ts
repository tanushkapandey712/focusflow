/**
 * Supabase email+password auth — uses the shared client from supabaseClient.ts.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../data/supabaseClient";

export const isSupabaseEmailAuthConfigured = isSupabaseConfigured;

// ---------------------------------------------------------------------------
// Sign Up (email + password)
// ---------------------------------------------------------------------------

export const signUpWithPassword = async (email: string, password: string) => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/sign-in`,
    },
  });

  if (error) throw error;

  // Supabase returns a user with identities=[] if the email is already taken
  // but "Confirm email" is enabled. Check for this edge case.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error("An account with this email already exists. Try signing in instead.");
  }

  return data;
};

// ---------------------------------------------------------------------------
// Sign In (email + password)
// ---------------------------------------------------------------------------

export const signInWithPassword = async (email: string, password: string) => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Supabase returns "Invalid login credentials" for both wrong password
    // and unconfirmed email. Provide a friendlier message.
    if (error.message === "Email not confirmed") {
      throw new Error("Please verify your email before signing in. Check your inbox.");
    }
    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export const resetPasswordForEmail = async (email: string) => {
  const client = getSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
};

export const updateUserPassword = async (password: string) => {
  const client = getSupabaseClient();
  const { error } = await client.auth.updateUser({
    password,
  });

  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Session helpers (unchanged)
// ---------------------------------------------------------------------------

export const getCurrentEmailAuthSession = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await getSupabaseClient().auth.getSession();

  if (error) throw error;
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
