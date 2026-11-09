import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "../../shared/lib/api.js";
import { authApi } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback(({ user, token }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      login: (email, password) => authApi.login(email, password).then(handleAuth),
      register: (data) => authApi.register(data).then(handleAuth),
      logout: () => {
        tokenStore.set(null);
        setUser(null);
      },
    }),
    [user, loading, handleAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
