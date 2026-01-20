import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI, logoutAPI, meAPI, registerAPI } from '@/lib/api';

type User = { id: number; name?: string; email: string } | null;

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

  useEffect(() => {
    let mounted = true;
    meAPI()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const u = await loginAPI({ email, password });
    setUser(u);
    navigate('/');
  };

  const register = async (name: string, email: string, password: string) => {
    const u = await registerAPI({ name, email, password });
    setUser(u);
    navigate('/');
  };

  const logout = async () => {
    await logoutAPI();
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
