import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, ActivityAPI } from '../api/client';
import { DEMO_MODE } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    const bootstrap = async () => {
      try {
        if (token) {
          const { data } = await AuthAPI.me();
          setUser(data.user);
        }
      } catch (_) {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await AuthAPI.login({ email, password });
    sessionStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await AuthAPI.register(payload);
    return data;
  };

  const updateMe = async (payload) => {
    const { data } = await AuthAPI.updateMe(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await ActivityAPI.logout().catch(() => {});
      }
    } catch (_) {}
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout, updateMe }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
