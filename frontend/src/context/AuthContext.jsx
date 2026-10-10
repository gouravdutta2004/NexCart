import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nexcart_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexcart_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync session with backend profile check if token exists
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('nexcart_user', JSON.stringify(res.user));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    const { user: userData, token: jwtToken } = result;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('nexcart_user', JSON.stringify(userData));
    localStorage.setItem('nexcart_token', jwtToken);
    return userData;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    const { user: newUser, token: jwtToken } = result;
    setUser(newUser);
    setToken(jwtToken);
    localStorage.setItem('nexcart_user', JSON.stringify(newUser));
    localStorage.setItem('nexcart_token', jwtToken);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexcart_user');
    localStorage.removeItem('nexcart_token');
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('nexcart_user', JSON.stringify(merged));
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
