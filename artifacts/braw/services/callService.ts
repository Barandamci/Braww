import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export interface CallDoc {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto: string | null;
  receiverId: string;
  status: "ringing" | "accepted" | "rejected" | "ended";
  createdAt: number;
}

export async function initiateCall(
  callerId: string,
  callerName: string,
  callerPhoto: string | null,
  receiverId: string
): Promise<string> {
  const ref = await addDoc(collection(db, "calls"), {
    callerId,
    callerName,
    callerPhoto,
    receiverId,
    status: "ringing",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function acceptCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), { status: "accepted" });
}

export async function rejectCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), { status: "rejected" });
}

export async function endCall(callId: string) {
  await updateDoc(doc(db, "calls", callId), { status: "ended" });
}

export function subscribeToIncomingCalls(
  uid: string,
  callback: (call: CallDoc | null) => void
) {
  const q = query(
    collection(db, "calls"),
    where("receiverId", "==", uid),
    where("status", "==", "ringing")
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const d = snap.docs[0];
    const data = d.data();
    callback({
      id: d.id,
      callerId: data.callerId,
      callerName: data.callerName,
      callerPhoto: data.callerPhoto ?? null,
      receiverId: data.receiverId,
      status: data.status,
      createdAt: data.createdAt?.toMillis?.() ?? 0,
    });
  });
}

export function subscribeToCallStatus(
  callId: string,
  callback: (status: string) => void
) {
  return onSnapshot(doc(db, "calls", callId), (snap) => {
    if (snap.exists()) {
      callback(snap.data().status);
    }
  });
}
