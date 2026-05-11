import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Mesajlar",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1A6DFF",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("calls", {
      name: "Aramalar",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#34C759",
      sound: "default",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "braw-te",
    });
    const token = tokenData.data;
    await updateDoc(doc(db, "users", uid), { pushToken: token });
    return token;
  } catch {
    return null;
  }
}

export async function showMessageNotification(
  senderName: string,
  message: string,
  chatId: string,
  isGroup?: boolean
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: senderName,
      body: message,
      data: { chatId, isGroup: isGroup ?? false },
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "messages" } : {}),
    },
    trigger: null,
  });
}

export async function showIncomingCallNotification(
  callerName: string,
  callId: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Gelen Arama",
      body: `${callerName} sizi arıyor`,
      data: { callId, type: "call" },
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "calls" } : {}),
    },
    trigger: null,
  });
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}
