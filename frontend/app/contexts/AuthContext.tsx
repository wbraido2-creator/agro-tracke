import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      await AsyncStorage.setItem('token', token);
      setUser(userData);
    } catch (error: any) {
      console.log('Login error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    }
  }

  async function signUp(name: string, email: string, password: string, phone?: string) {
    try {
      const response = await api.post('/api/auth/register', { name, email, password, phone });
      const { token, user: userData } = response.data;
      
      await AsyncStorage.setItem('token', token);
      setUser(userData);
    } catch (error: any) {
      console.log('Register error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Erro ao criar conta');
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}