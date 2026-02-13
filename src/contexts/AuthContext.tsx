import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  position?: string;
  is_active: boolean;
  bu_id: number;
  current_band: string;
  leader_id: number | null;
  leader_top?: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token") || null;
  });

  const [isLoading] = useState(false);

  // LOG de Depuração (logar apenas quando o usuário mudar, não a cada render)
  useEffect(() => {
    console.log("AuthProvider: usuário atual:", user?.name);
  }, [user?.name]);

  // Persistência
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Funções de Autenticação (Definidas ANTES do useMemo)
  const setAuth = useCallback((newUser: User | null, newToken: string | null) => {
    console.log("🚨 setAuth foi chamada!"); // Adicione isso
    setUser(newUser);
    setToken(newToken);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    console.log("🚨 updateUser foi chamada com:", updates); // Adicione isso
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");

      return fetch(url, { ...options, headers });
    },
    [token],
  );

  // Memoização do valor do contexto para evitar re-renders desnecessários nos filhos
  const authContextValue = useMemo(
    () => ({
      user,
      token,
      setAuth,
      updateUser,
      isAuthenticated: !!user && !!token,
      isLoading,
      logout,
      authFetch,
    }),
    [user, token, isLoading, setAuth, updateUser, logout, authFetch],
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
