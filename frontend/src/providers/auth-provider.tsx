'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

// Define types for authentication
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  checkAuth: async () => false,
};

const AuthContext = createContext<AuthState>(initialState);

// Set up API client with authentication
const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const savedToken = Cookies.get('token');
      if (!savedToken) {
        return false;
      }

      setToken(savedToken);
      const response = await apiClient.get('/auth/me');

      if (response.data.success) {
        setUser(response.data.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      setToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store token in cookie (httpOnly for production)
        Cookies.set('token', token, {
          expires: 1, // 1 day
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        setUser(user);
        setToken(token);

        // Redirect to dashboard after login
        router.push('/dashboard');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    setToken(null);
    router.push('/auth/login');
  };

  // Check authentication on initial load
  useEffect(() => {
    const initAuth = async () => {
      const isAuthenticated = await checkAuth();

      // If not authenticated and trying to access protected route
      if (!isAuthenticated &&
          !pathname.startsWith('/auth') &&
          pathname !== '/' &&
          !pathname.startsWith('/_next')) {
        router.push('/auth/login');
      }

      // If authenticated and trying to access auth routes
      if (isAuthenticated && pathname.startsWith('/auth')) {
        router.push('/dashboard');
      }
    };

    initAuth();
  }, [pathname]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
