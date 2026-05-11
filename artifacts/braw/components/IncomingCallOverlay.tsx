import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { acceptCall, rejectCall } from "@/services/callService";
import type { CallDoc } from "@/services/callService";
import { useRouter } from "expo-router";

interface Props {
  call: CallDoc;
  onDismiss: () => void;
}

export function IncomingCallOverlay({ call, onDismiss }: Props) {
  const colors = useColors();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    if (Platform.OS !== "web") {
      const hapticInterval = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 1500);
      return () => clearInterval(hapticInterval);
    }
  }, []);

  const handleAccept = async () => {
    await acceptCall(call.id);
    onDismiss();
    router.push(`/voice-call/${call.callerId}?callId=${call.id}&incoming=true`);
  };

  const handleReject = async () => {
    await rejectCall(call.id);
    onDismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "#111827",
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <UserAvatar
              photoURL={call.callerPhoto}
              name={call.callerName}
              size={52}
            />
          </Animated.View>
          <View style={styles.callerInfo}>
            <Text style={styles.callerLabel}>Gelen Arama</Text>
            <Text style={styles.callerName} numberOfLines={1}>
              {call.callerName}
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={handleReject}
          >
            <Text style={styles.rejectText}>Reddet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptText}>Cevapla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 56,
    gap: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  callerInfo: { flex: 1 },
  callerLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  callerName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  rejectBtn: {
    backgroundColor: "#FF3B30",
  },
  rejectText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: "#34C759",
  },
  acceptText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
