import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type StaffProfile = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
};

export default function useStaffSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        if (isMounted) {
          setProfile(null);
          setIsStaff(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (isMounted) {
        if (error) {
          setProfile(null);
          setIsStaff(false);
          return;
        }

        const nextProfile = (data as StaffProfile) || null;
        setProfile(nextProfile);
        setIsStaff(!!nextProfile?.role && nextProfile.role !== "customer");
      }
    };

    const loadSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const nextSession = data.session || null;

      if (isMounted) {
        setSession(nextSession);
        setUser(nextSession?.user || null);
      }

      await loadProfile(nextSession);

      if (isMounted) {
        setLoading(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession || null);
        setUser(nextSession?.user || null);
        setLoading(false);
      }
      void loadProfile(nextSession || null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, user, profile, isStaff };
}
