import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";

type UserRole = "admin" | "user";
type User = { id: string; name?: string; email: string; role?: UserRole } | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
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

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data, error } = await api.getCurrentUser();
      if (mounted) {
        if (!error && data?.user) {
          setUser(data.user);
        }
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string, redirectTo = '/') => {
    const { data, error } = await api.login(email, password);
    if (error) {
      throw new Error(error);
    }
    if (data?.user) {
      setUser(data.user);
      navigate(redirectTo);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await api.register(name, email, password);
    if (error) {
      throw new Error(error);
    }
    if (data?.user) {
      setUser(data.user);
      navigate('/');
    }
  };

  const logout = async () => {
    await api.logout();
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
