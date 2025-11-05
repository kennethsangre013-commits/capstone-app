import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  getIdToken,
  User,
} from "firebase/auth";
import { auth } from "../firebase";

const TOKEN_KEY = "auth_id_token";

type AuthContextType = {
  user: User | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  idToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  refreshIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "Email already in use.";
    case "auth/weak-password":
      return "Password is too weak.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });

    const unsubToken = onIdTokenChanged(auth, async (u) => {
      if (u) {
        const token = await u.getIdToken();
        setIdToken(token);
        setUser(u);
        try {
          await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch {}
      } else {
        setIdToken(null);
        setUser(null);
        try {
          await AsyncStorage.removeItem(TOKEN_KEY);
        } catch {}
      }
    });

    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (t) setIdToken(t);
      } catch {}
    })();

    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const u = auth.currentUser;
      if (u && !u.emailVerified) {
        try { await sendEmailVerification(u); } catch {}
        setError("Please verify your email. A verification link has been sent to your inbox.");
        return;
      }
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try { await sendEmailVerification(cred.user); } catch {}
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {}
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerification = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(u);
    } catch (e: any) {
      setError(mapAuthError(e?.code));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshIdToken = useCallback(async () => {
    if (auth.currentUser) {
      const t = await getIdToken(auth.currentUser, true);
      setIdToken(t);
      try { await AsyncStorage.setItem(TOKEN_KEY, t); } catch {}
      return t;
    }
    return null;
  }, []);

  const value: AuthContextType = useMemo(() => (
    { user, initializing, loading, error, idToken, signIn, signUp, signOut, sendReset, sendVerification, refreshIdToken }
  ), [user, initializing, loading, error, idToken, signIn, signUp, signOut, sendReset, sendVerification, refreshIdToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
