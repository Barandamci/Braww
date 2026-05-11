import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCylUIn89c7Xkev3tbBSncFGqNwPchb3bU",
  authDomain: "braw-te.firebaseapp.com",
  projectId: "braw-te",
  storageBucket: "braw-te.firebasestorage.app",
  messagingSenderId: "531426380270",
  appId: "1:531426380270:android:c6c6d4ea0cab4ed79fa6ff",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
