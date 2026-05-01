"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

export function useAuth() {
  const supabase = useMemo(() => createClient(), []);
  const setUserEmail = useInvestigatorStore((s) => s.setUserEmail);
  const setUserCountry = useInvestigatorStore((s) => s.setUserCountry);
  const setIsPremium = useInvestigatorStore((s) => s.setIsPremium);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async (userId: string | null, email: string | null) => {
      if (!userId) {
        setUserEmail("");
        setIsPremium(false);
        return;
      }
      setUserEmail(email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("country_code, is_premium")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        if (data.country_code) setUserCountry(data.country_code);
        setIsPremium(Boolean(data.is_premium));
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      hydrate(session?.user.id ?? null, session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, setUserEmail, setUserCountry, setIsPremium]);

  return useMemo(
    () => ({
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email: string, password: string, country: string) => {
        const redirectTo =
          typeof window !== "undefined" ? window.location.origin : undefined;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { country_code: country },
            emailRedirectTo: redirectTo,
          },
        });
        if (error) throw error;
        // Ensure the profile reflects the country even if the trigger ran with default.
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ country_code: country })
            .eq("id", data.user.id);
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [supabase]
  );
}
