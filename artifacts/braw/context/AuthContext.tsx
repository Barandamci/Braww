import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { isOwnerEmail } from "@/constants/owner";

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL: string | null;
  verified: "blue" | "black" | null;
  isAdmin: boolean;
  isOwner?: boolean;
  isBanned: boolean;
  banReason: string | null;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email?: string | null) => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const owner = isOwnerEmail(email ?? data.email);
        setProfile({ ...data, isOwner: owner, isAdmin: owner ? true : data.isAdmin });
      }
    } catch (e) {
      console.error("fetchProfile error", e);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u.uid, u.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(cred.user.uid, cred.user.email);
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    const lower = username.toLowerCase().trim();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const owner = isOwnerEmail(email);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name.trim(),
      username: lower,
      email,
      photoURL: null,
      verified: null,
      isAdmin: owner,
      isOwner: owner,
      isBanned: false,
      banReason: null,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid, user.email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
