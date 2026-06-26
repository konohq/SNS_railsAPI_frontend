import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth";
import { clearAuthSession, setUnauthorizedHandler } from "./client";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = useCallback((newToken) => {
    if (!newToken) return;

    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
  }, []);

  useEffect(() => {
    return setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const value = useMemo(() => ({
    isAuthenticated: Boolean(token),
    login,
    logout,
    token
  }), [login, logout, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
