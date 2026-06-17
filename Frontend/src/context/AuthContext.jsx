import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signIn, signUp, logout as apiLogout, checkAuth } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await checkAuth();
        if (active) {
          setUser(res.data.user);
        }
      } catch (_) {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    const res = await signIn(credentials);
    setUser(res.data.user);
    setLoading(false);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await signUp(data);
    setUser(res.data.user);
    setLoading(false);
    return res.data.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
