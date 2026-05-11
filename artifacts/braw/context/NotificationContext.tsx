import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  showIncomingCallNotification,
} from "@/services/notificationService";
import { subscribeToIncomingCalls, type CallDoc } from "@/services/callService";
import type { BannerData } from "@/components/InAppNotificationBanner";
import { useAuth } from "@/context/AuthContext";

interface NotificationContextType {
  banners: BannerData[];
  dismissBanner: (id: string) => void;
  incomingCall: CallDoc | null;
  dismissCall: () => void;
  setActiveChatId: (id: string | null) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [incomingCall, setIncomingCall] = useState<CallDoc | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const lastMsgTimestamps = useRef<Record<string, number>>({});
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const initialized = useRef(false);

  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id;
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    registerForPushNotifications(user.uid);

    responseListenerRef.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type === "call" && data?.callId) {
        router.push(`/voice-call/${String(data.callId)}`);
      } else if (data?.chatId) {
        if (data.isGroup) {
          router.push(`/group/${String(data.chatId)}`);
        } else {
          router.push(`/chat/${String(data.chatId)}`);
        }
      }
    });

    return () => {
      responseListenerRef.current?.remove();
    };
  }, [user?.uid, profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", profile.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!initialized.current) {
        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.lastMessageTime?.toMillis?.() ?? 0;
          lastMsgTimestamps.current[d.id] = ts;
        });
        initialized.current = true;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          const chatId = change.doc.id;
          const ts = data.lastMessageTime?.toMillis?.() ?? 0;
          const prev = lastMsgTimestamps.current[chatId] ?? 0;
          const lastSenderId: string = data.lastMessageSenderId ?? "";

          if (ts > prev && lastSenderId && lastSenderId !== profile.uid) {
            lastMsgTimestamps.current[chatId] = ts;

            if (activeChatIdRef.current === chatId) return;

            const names: Record<string, string> = data.participantNames ?? {};
            const photos: Record<string, string | null> = data.participantPhotos ?? {};
            const senderName = names[lastSenderId] ?? "Biri";
            const senderPhoto = photos[lastSenderId] ?? null;
            const bodyText: string = data.lastMessage ?? "Yeni mesaj";

            const banner: BannerData = {
              id: chatId + "_" + ts,
              title: senderName,
              body: bodyText,
              photoURL: senderPhoto,
              onPress: () => router.push(`/chat/${chatId}`),
            };

            setBanners((prev) => {
              const exists = prev.some((b) => b.id === banner.id);
              if (exists) return prev;
              return [...prev.slice(-2), banner];
            });

            if (Platform.OS !== "web") {
              import("@/services/notificationService").then(({ showMessageNotification }) => {
                showMessageNotification(senderName, bodyText, chatId, false);
              });
            }
          } else {
            lastMsgTimestamps.current[chatId] = Math.max(prev, ts);
          }
        }
      });
    });

    return () => {
      unsub();
      initialized.current = false;
    };
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", profile.uid)
    );
    const groupTimestamps = {} as Record<string, number>;
    let groupInit = false;

    const unsub = onSnapshot(q, (snap) => {
      if (!groupInit) {
        snap.docs.forEach((d) => {
          const data = d.data();
          const ts = data.lastMessageTime?.toMillis?.() ?? 0;
          groupTimestamps[d.id] = ts;
        });
        groupInit = true;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          const groupId = change.doc.id;
          const ts = data.lastMessageTime?.toMillis?.() ?? 0;
          const prev = groupTimestamps[groupId] ?? 0;
          const lastSenderId: string = data.lastMessageSenderId ?? "";

          if (ts > prev && lastSenderId && lastSenderId !== profile.uid) {
            groupTimestamps[groupId] = ts;

            if (activeChatIdRef.current === groupId) return;

            const groupName: string = data.name ?? "Grup";
            const bodyText: string = data.lastMessage ?? "Yeni mesaj";
            const senderName: string = data.lastMessageSenderName ?? "Biri";

            const banner: BannerData = {
              id: groupId + "_" + ts,
              title: `${groupName}`,
              body: `${senderName}: ${bodyText}`,
              photoURL: data.photoURL ?? null,
              onPress: () => router.push(`/group/${groupId}`),
            };

            setBanners((prev) => {
              const exists = prev.some((b) => b.id === banner.id);
              if (exists) return prev;
              return [...prev.slice(-2), banner];
            });

            if (Platform.OS !== "web") {
              import("@/services/notificationService").then(({ showMessageNotification }) => {
                showMessageNotification(groupName, `${senderName}: ${bodyText}`, groupId, true);
              });
            }
          } else {
            groupTimestamps[groupId] = Math.max(prev, ts);
          }
        }
      });
    });

    return unsub;
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = subscribeToIncomingCalls(profile.uid, (call) => {
      setIncomingCall(call);
      if (call && Platform.OS !== "web") {
        showIncomingCallNotification(call.callerName, call.id);
      }
    });
    return unsub;
  }, [profile?.uid]);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const dismissCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ banners, dismissBanner, incomingCall, dismissCall, setActiveChatId }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
