import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/api-client";
import { auth } from "@/lib/firebase";
import { getProfile } from "@/lib/firebase-db";
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

  const toUserFromFirebase = async (uid: string, email: string | null, displayName: string | null) => {
    let profile: { role?: string; name?: string; full_name?: string } | null = null;
    try {
      profile = await getProfile(uid);
    } catch (err) {
      console.warn("Could not fetch Firestore profile (permissions?), falling back to display name.", err);
    }
    const name = profile?.full_name || profile?.name || displayName || "User";
    const role = normalizeRole(profile?.role);
    return { id: uid, email: email || "", name, role };
  };

  const hydrateRoleFromProfile = async (nextUser: User): Promise<User> => {
    if (!nextUser?.id) {
      return nextUser;
    }
    const fallbackRole: UserRole = normalizeRole(nextUser.role);
    let profile: { role?: string; name?: string; full_name?: string } | null = null;
    try {
      profile = await getProfile(nextUser.id);
    } catch (err) {
      console.warn("Could not hydrate profile from Firestore.", err);
    }
    const role = profile?.role ? normalizeRole(profile.role) : fallbackRole;
    return { ...nextUser, role };
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
      if (mounted) setLoading(false);
    }, 10000);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      if (firebaseUser) {
        const nextUser = await toUserFromFirebase(
          firebaseUser.uid,
          firebaseUser.email || null,
          firebaseUser.displayName || null
        );
        if (mounted) setUser(nextUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimeout);
      unsub();
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

      const hydrated = withKnownRole(payload.user) || (await hydrateRoleFromProfile(payload.user));
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
      nextUser = withKnownRole(payload.user) || (await hydrateRoleFromProfile(payload.user));
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
      const nextUser = withKnownRole(payload.user) || (await hydrateRoleFromProfile(payload.user));
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
