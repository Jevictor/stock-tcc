import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

console.log('useAuth: Module loading');

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('AuthProvider: Initializing');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect running');
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('AuthProvider: Auth state changed', event, session?.user?.id);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('AuthProvider: Initial session', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: Cleaning up subscription');
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('AuthProvider: Error in useEffect', error);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  console.log('AuthProvider: Rendering with', { user: user?.id, loading });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  console.log('useAuth: Hook called');
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth: Must be used within AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};