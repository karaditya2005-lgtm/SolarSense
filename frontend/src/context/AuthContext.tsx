import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.ts';
import { authApi } from '../api/auth.ts';
import { userApi } from '../api/users.ts';
import { setLogoutHandler } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
  refreshSession: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser((prev) => {
        // Only update state if user data actually changed to prevent re-render cycles
        if (JSON.stringify(prev) === JSON.stringify(freshUser)) return prev;
        return freshUser;
      });
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setLogoutHandler(() => {
      setUser(null);
    });

    // Silent session restore on app mount
    refreshSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    return data.user;
  };


  const register = async (name: string, email: string, password: string) => {
    await authApi.register({ name, email, password });
  };

  const updateUser = async (data: Partial<User>) => {
    const updated = await userApi.updateMe(data);
    setUser(updated);
    return updated;
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshSession,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
