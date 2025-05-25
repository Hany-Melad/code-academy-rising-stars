import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, ensureValidRole } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{error: Error | null}>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{error: Error | null}>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{error: Error | null}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state management");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthProvider: Auth state change:", event, session?.user?.id || 'no session');
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false); // Important: set loading to false when no user
        }
      }
    );

    // Then get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthProvider: Error getting initial session:", error);
          setIsLoading(false);
          return;
        }
        
        console.log("AuthProvider: Initial session:", session?.user?.id || 'no session');
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("AuthProvider: Exception getting initial session:", error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("AuthProvider: Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthProvider: Error fetching profile:', error);
        setIsLoading(false);
        return;
      }
      
      console.log("AuthProvider: Profile fetched successfully:", data?.name);
      setProfile(data);
      setIsLoading(false);
    } catch (error) {
      console.error('AuthProvider: Exception while fetching profile:', error);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      return { error: null };
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      // Process the userData to ensure it includes necessary fields
      const processedUserData = {
        name: userData.name || "",
        email: email,
        role: ensureValidRole(userData.role || "student"),
        age: userData.age || null,
        phone: userData.phone || null,
        location: userData.location || null,
      };

      // Sign up the user with the processed data
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: processedUserData,
        },
      });
      
      if (error) throw error;
      
      // After successful signup, notify the user
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
      return { error: null };
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log("AuthProvider: Starting sign out");
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("AuthProvider: Sign out error:", error);
        throw error;
      }
      
      console.log("AuthProvider: Sign out completed successfully");
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      console.error("AuthProvider: Sign out failed:", error);
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for the password reset link.",
      });
      return { error: null };
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isLoading,
      isAdmin,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
