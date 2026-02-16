import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type User = { id: string; name?: string; email: string } | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mapUser = useMemo(
    () => (supabaseUser: { id: string; email?: string | null; user_metadata?: any } | null) => {
      if (!supabaseUser || !supabaseUser.email) return null;
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      };
    },
    []
  );

  const ensureProfile = async (supabaseUser: { id: string; user_metadata?: any } | null) => {
    if (!supabaseUser) return;
    const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null;

    await supabase
      .from("profiles")
      .upsert({
        id: supabaseUser.id,
        full_name: fullName,
        name: fullName,
      }, { onConflict: "id" });
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        await ensureProfile(data.user || null);
        setUser(mapUser(data.user));
        setLoading(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        void ensureProfile(session?.user || null);
        setUser(mapUser(session?.user || null));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [mapUser]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    await ensureProfile(data.user);
    setUser(mapUser(data.user));
    navigate('/');
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) {
      throw error;
    }
    await ensureProfile(data.user);
    setUser(mapUser(data.user));
    navigate('/');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
