import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { UserProfile } from "@/context/AuthContext";

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function searchUsersByUsername(username: string): Promise<UserProfile[]> {
  const lower = username.toLowerCase().trim();
  if (!lower) return [];
  const q = query(
    collection(db, "users"),
    where("username", ">=", lower),
    where("username", "<=", lower + "\uf8ff")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", uid), data);
}
