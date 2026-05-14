"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getAnimalEmoji } from "@/lib/avatars";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not confirmed") || m.includes("email not confirmed")) {
    return "Please confirm your email — check your inbox (and spam) for the verification link.";
  }
  if (m.includes("invalid login credentials")) {
    return "Invalid email or password. If you just signed up, confirm your email first.";
  }
  if (m.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

export function useAuth() {
  const supabase = useMemo(() => createClient(), []);
  const setUserId = useInvestigatorStore((s) => s.setUserId);
  const setUserEmail = useInvestigatorStore((s) => s.setUserEmail);
  const setUserCountry = useInvestigatorStore((s) => s.setUserCountry);
  const avatarEmoji = useInvestigatorStore((s) => s.avatarEmoji);
  const setAvatarEmoji = useInvestigatorStore((s) => s.setAvatarEmoji);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      const sessionActive = sessionStorage.getItem("dql-session-active");
      if (!sessionActive) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          await supabase.auth.signOut();
          setUserId("");
          setUserEmail("");
          setUserCountry("US");
        }
      }
      sessionStorage.setItem("dql-session-active", "true");

      if (cancelled) return;

      const hydrate = async (userId: string | null, email: string | null) => {
        if (!userId) {
          setUserId("");
          setUserEmail("");
          return;
        }
        setUserId(userId);
        setUserEmail(email ?? "");
        const { data } = await supabase
          .from("profiles")
          .select("country_code")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          if (data.country_code) setUserCountry(data.country_code);
        }
        if (!avatarEmoji && email) {
          setAvatarEmoji(getAnimalEmoji(email));
        }
      };

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN") {
          hydrate(session?.user.id ?? null, session?.user.email ?? null);
        }
        if (event === "SIGNED_OUT") {
          hydrate(null, null);
        }
      });

      unsubscribe = () => sub.subscription.unsubscribe();
    };

    init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [supabase, setUserId, setUserEmail, setUserCountry]);

  return useMemo(
    () => ({
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(email),
          password,
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },
      signUp: async (email: string, password: string, country: string) => {
        const normalized = normalizeEmail(email);
        const { data, error } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: { data: { country_code: country } },
        });
        if (error) throw new Error(friendlyAuthError(error.message));
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ country_code: country })
            .eq("id", data.user.id);
        }
        return {
          needsEmailConfirmation: !data.session,
        };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      resetPassword: async (email: string) => {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(
          normalizeEmail(email),
          redirectTo ? { redirectTo } : undefined
        );
        if (error) throw new Error(friendlyAuthError(error.message));
      },
      resendConfirmation: async (email: string) => {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: normalizeEmail(email),
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },
    }),
    [supabase]
  );
}
