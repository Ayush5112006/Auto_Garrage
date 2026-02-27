import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext, User, UserRole } from "@/context/useAuth";

const USER_ROLE: UserRole = "customer";
const APP_SESSION_COOKIE = "ag_session";
const VISITOR_COOKIE = "ag_visit_id";

const normalizeRole = (value?: string | null): UserRole => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "manager" || normalized === "host" || normalized === "owner") return "manager";
  if (normalized === "staff" || normalized === "mechanic") return "staff";
  if (normalized === "customer" || normalized === "user") return "customer";
  return USER_ROLE;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const hasCookie = (name: string) => {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${name}=`));
};

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

const withKnownRole = (candidate: User): User => {
  if (!candidate) return candidate;
  return { ...candidate, role: normalizeRole(candidate.role) };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const toUserFromSession = async (sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, any> }) => {
    const fallbackName =
      String(sessionUser.user_metadata?.name || sessionUser.user_metadata?.full_name || "").trim() || "User";

    return hydrateRoleFromSupabase({
      id: sessionUser.id,
      email: sessionUser.email || "",
      name: fallbackName,
      role: USER_ROLE,
    });
  };

  const hydrateRoleFromSupabase = async (nextUser: User): Promise<User> => {
    if (!nextUser?.id) {
      return nextUser;
    }

    const fallbackRole: UserRole = normalizeRole(nextUser.role);

    if (!isUuid(nextUser.id)) {
      return { ...nextUser, role: fallbackRole };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (error || !data?.role) {
      return { ...nextUser, role: fallbackRole };
    }

    const normalizedRole = normalizeRole(String(data.role));
    return { ...nextUser, role: normalizedRole };
  };

  useEffect(() => {
    if (!hasCookie(VISITOR_COOKIE)) {
      const visitorId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      setCookie(VISITOR_COOKIE, visitorId, 60 * 60 * 24 * 365);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const safetyTimeout = window.setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 10000);

    const loadUser = async () => {
      try {
        const { data, error } = await api.getCurrentUser();
        const payload = data as { user?: User } | undefined;
        if (!mounted) return;

        if (!error && payload?.user) {
          const hydratedUser = withKnownRole(payload.user) || (await hydrateRoleFromSupabase(payload.user));
          if (!mounted) return;
          setUser(hydratedUser);
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const hydratedUser = await toUserFromSession(session.user as any);
          if (!mounted) return;
          setUser(hydratedUser);
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const nextUser = await toUserFromSession(session.user as any);
          if (!mounted) return;
          setUser(nextUser);
          setLoading(false);
          return;
        }

        const { data: apiData, error: apiError } = await api.getCurrentUser();
        const apiPayload = apiData as { user?: User } | undefined;

        if (!mounted) return;

        if (!apiError && apiPayload?.user) {
          const nextUser = withKnownRole(apiPayload.user) || (await hydrateRoleFromSupabase(apiPayload.user));
          if (!mounted) return;
          setUser(nextUser);
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      setCookie(APP_SESSION_COOKIE, user.id, 60 * 60 * 24 * 30);
    } else {
      clearCookie(APP_SESSION_COOKIE);
    }
  }, [user?.id]);

  const refreshUser = async () => {
    try {
      const { data, error } = await api.getCurrentUser();
      const payload = data as { user?: User } | undefined;
      if (error || !payload?.user) {
        setUser(null);
        return;
      }

      const hydrated = withKnownRole(payload.user) || (await hydrateRoleFromSupabase(payload.user));
      setUser(hydrated);
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string, redirectTo?: string, rememberMe = true) => {
    const { data, error } = await api.login(email, password, rememberMe);
    const payload = data as { user?: User } | undefined;
    if (error) {
      throw new Error(error);
    }

    let nextUser: User = null;
    if (payload?.user) {
      nextUser = withKnownRole(payload.user) || (await hydrateRoleFromSupabase(payload.user));
      setUser(nextUser);
    }

    if (nextUser && !redirectTo) {
      if (nextUser.role === "admin") navigate("/admin");
      else if (nextUser.role === "manager") navigate("/garagehost");
      else if (nextUser.role === "mechanic" || nextUser.role === "staff") navigate("/staff");
      else navigate("/dashboard");
    } else if (nextUser && redirectTo) {
      navigate(redirectTo);
    }

    return nextUser;
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await api.register(name, email, password);
    const payload = data as { user?: User } | undefined;
    if (error) {
      throw new Error(error);
    }
    if (payload?.user) {
      const nextUser = withKnownRole(payload.user) || (await hydrateRoleFromSupabase(payload.user));
      setUser(nextUser);
      navigate('/');
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
