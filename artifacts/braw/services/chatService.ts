import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/services/firebase";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaUrl: string | null;
  mediaType: "image" | "file" | null;
  fileName: string | null;
  createdAt: number;
  type: "text" | "image" | "file";
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string | null>;
  participantVerified: Record<string, "blue" | "black" | null>;
  lastMessage: string;
  lastMessageTime: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  photoURL: string | null;
  createdBy: string;
  members: string[];
  admins: string[];
  lastMessage: string;
  lastMessageTime: number;
  createdAt: number;
}

export async function getOrCreateChat(myUid: string, otherUid: string): Promise<string> {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", myUid)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.participants.includes(otherUid)) return d.id;
  }
  const chatRef = await addDoc(collection(db, "chats"), {
    participants: [myUid, otherUid],
    participantNames: {},
    participantPhotos: {},
    participantVerified: {},
    lastMessage: "",
    lastMessageTime: serverTimestamp(),
  });
  return chatRef.id;
}

export function subscribeToChats(uid: string, callback: (chats: Chat[]) => void) {
  const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const chats: Chat[] = snap.docs.map((d) => {
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
    chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    callback(chats);
  });
}

export function subscribeToMessages(chatId: string, callback: (msgs: ChatMessage[]) => void) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const msgs: ChatMessage[] = snap.docs.map((d) => {
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
    callback(msgs);
  });
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUri?: string,
  mediaType?: "image" | "file",
  fileName?: string
) {
  let mediaUrl: string | null = null;
  let msgType: "text" | "image" | "file" = "text";

  if (mediaUri && mediaType) {
    const path = `chats/${chatId}/${Date.now()}_${fileName ?? "file"}`;
    const storageRef = ref(storage, path);
    const resp = await fetch(mediaUri);
    const blob = await resp.blob();
    await uploadBytes(storageRef, blob);
    mediaUrl = await getDownloadURL(storageRef);
    msgType = mediaType;
  }

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    senderName,
    text,
    mediaUrl,
    mediaType: mediaType ?? null,
    fileName: fileName ?? null,
    type: msgType,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: mediaType === "image" ? "Fotoğraf" : mediaType === "file" ? `Dosya: ${fileName}` : text,
    lastMessageTime: serverTimestamp(),
  });
}

export function subscribeToGroups(uid: string, callback: (groups: Group[]) => void) {
  const q = query(collection(db, "groups"), where("members", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const groups: Group[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        description: data.description ?? "",
        photoURL: data.photoURL ?? null,
        createdBy: data.createdBy ?? "",
        members: data.members ?? [],
        admins: data.admins ?? [],
        lastMessage: data.lastMessage ?? "",
        lastMessageTime: data.lastMessageTime?.toMillis?.() ?? 0,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      };
    });
    groups.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    callback(groups);
  });
}

export function subscribeToGroupMessages(groupId: string, callback: (msgs: ChatMessage[]) => void) {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const msgs: ChatMessage[] = snap.docs.map((d) => {
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
    callback(msgs);
  });
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUri?: string,
  mediaType?: "image" | "file",
  fileName?: string
) {
  let mediaUrl: string | null = null;
  let msgType: "text" | "image" | "file" = "text";

  if (mediaUri && mediaType) {
    const path = `groups/${groupId}/${Date.now()}_${fileName ?? "file"}`;
    const storageRef = ref(storage, path);
    const resp = await fetch(mediaUri);
    const blob = await resp.blob();
    await uploadBytes(storageRef, blob);
    mediaUrl = await getDownloadURL(storageRef);
    msgType = mediaType;
  }

  await addDoc(collection(db, "groups", groupId, "messages"), {
    senderId,
    senderName,
    text,
    mediaUrl,
    mediaType: mediaType ?? null,
    fileName: fileName ?? null,
    type: msgType,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "groups", groupId), {
    lastMessage: mediaType === "image" ? "Fotoğraf" : mediaType === "file" ? `Dosya: ${fileName}` : text,
    lastMessageTime: serverTimestamp(),
  });
}

export async function createGroup(
  name: string,
  description: string,
  creatorUid: string,
  memberUids: string[]
): Promise<string> {
  const allMembers = Array.from(new Set([creatorUid, ...memberUids]));
  const ref2 = await addDoc(collection(db, "groups"), {
    name,
    description,
    photoURL: null,
    createdBy: creatorUid,
    members: allMembers,
    admins: [creatorUid],
    lastMessage: "",
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref2.id;
}

export async function uploadProfilePhoto(uid: string, uri: string): Promise<string> {
  const storageRef = ref(storage, `profiles/${uid}.jpg`);
  const resp = await fetch(uri);
  const blob = await resp.blob();
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, "users", uid), { photoURL: url });
  return url;
}
