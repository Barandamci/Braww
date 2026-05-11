import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { UserProfile } from "@/context/AuthContext";
import type { ChatMessage, Chat } from "@/services/chatService";

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function setVerified(uid: string, verified: "blue" | "black" | null) {
  await updateDoc(doc(db, "users", uid), { verified });
}

export async function banUser(uid: string, reason: string) {
  await updateDoc(doc(db, "users", uid), { isBanned: true, banReason: reason });
}

export async function unbanUser(uid: string) {
  await updateDoc(doc(db, "users", uid), { isBanned: false, banReason: null });
}

export async function getUserChats(uid: string): Promise<Chat[]> {
  const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      participants: data.participants ?? [],
      participantNames: data.participantNames ?? {},
      participantPhotos: data.participantPhotos ?? {},
      participantVerified: data.participantVerified ?? {},
      lastMessage: data.lastMessage ?? "",
      lastMessageTime: data.lastMessageTime?.toMillis?.() ?? 0,
    };
  });
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      senderId: data.senderId,
      senderName: data.senderName ?? "",
      text: data.text ?? "",
      mediaUrl: data.mediaUrl ?? null,
      mediaType: data.mediaType ?? null,
      fileName: data.fileName ?? null,
      createdAt: data.createdAt?.toMillis?.() ?? 0,
      type: data.type ?? "text",
    };
  });
}
