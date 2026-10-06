import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { backendApi, loadStoredToken, setAccessToken } from '../services/backendApi';
import { initSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User> | FormData) => Promise<boolean>;
  unreadChatCount: number;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshProfile = async () => {
    try {
      const profile = await backendApi.getUserProfile();
      setUser(profile);
      try {
        const counts = await backendApi.getUnreadNotificationCount();
        setUnreadChatCount(counts.unreadChatCount);
      } catch {
        // ignore
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    backendApi.setOnUnauthorized(() => {
      setUser(null);
      disconnectSocket();
    });

    const initAuth = async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          await refreshProfile();
        }
      } catch (err) {
        console.log('[Auth] No existing session or session expired');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const socket = initSocket(user.id);
      socket.on('message', () => {
        setUnreadChatCount((prev) => prev + 1);
      });
      return () => {
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [user?.id]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const loggedInUser = await backendApi.login(email, password);
      setUser(loggedInUser);
      try {
        const counts = await backendApi.getUnreadNotificationCount();
        setUnreadChatCount(counts.unreadChatCount);
      } catch {
        // ignore
      }
      return true;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      throw err;
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    try {
      const loggedInUser = await backendApi.loginWithGoogle(idToken);
      setUser(loggedInUser);
      return true;
    } catch (err) {
      console.error('[Auth] Google login error:', err);
      throw err;
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<boolean> => {
    try {
      await backendApi.register(name, email, password);
      return true;
    } catch (err) {
      console.error('[Auth] Register error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await backendApi.logout();
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      await setAccessToken(null);
      setUser(null);
      setUnreadChatCount(0);
      disconnectSocket();
    }
  };

  const updateProfile = async (updates: Partial<User> | FormData): Promise<boolean> => {
    if (!user) return false;
    try {
      const updated = await backendApi.updateProfile(updates);
      setUser(updated);
      return true;
    } catch (err) {
      console.error('[Auth] Update profile error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        unreadChatCount,
        setUnreadChatCount,
        refreshProfile,
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
