import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getUserById } from "@/services/userService";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import * as Haptics from "expo-haptics";
import type { UserProfile } from "@/context/AuthContext";

export default function VoiceCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [other, setOther] = useState<UserProfile | null>(null);
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (id) getUserById(id).then(setOther);
  }, [id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    const connectTimer = setTimeout(() => {
      setCallState("connected");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callState !== "connected") return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const handleHangup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallState("ended");
    setTimeout(() => router.back(), 1000);
  };

  function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: "#0D1117" }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#ffffff80" />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.avatarRing, { transform: [{ scale: callState === "ringing" ? pulseAnim : 1 }], borderColor: "#1A6DFF40" }]}>
          <View style={[styles.avatarRing2, { borderColor: "#1A6DFF70" }]}>
            <UserAvatar photoURL={other?.photoURL} name={other?.name ?? ""} size={100} />
          </View>
        </Animated.View>

        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{other?.name ?? "..."}</Text>
            {other?.verified && <VerifiedBadge verified={other.verified} size={18} />}
          </View>
          <Text style={styles.callStatus}>
            {callState === "ringing"
              ? "Aranıyor..."
              : callState === "connected"
              ? formatDuration(duration)
              : "Arama sona erdi"}
          </Text>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: botPad + 40 }]}>
        <View style={styles.topControls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, { backgroundColor: muted ? "#1A6DFF" : "#ffffff15" }]}
            onPress={() => { setMuted(!muted); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Feather name={muted ? "mic-off" : "mic"} size={22} color="#fff" />
            <Text style={styles.ctrlLabel}>{muted ? "Sessiz Açık" : "Sessiz"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctrlBtn, { backgroundColor: speakerOn ? "#1A6DFF" : "#ffffff15" }]}
            onPress={() => { setSpeakerOn(!speakerOn); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Feather name="volume-2" size={22} color="#fff" />
            <Text style={styles.ctrlLabel}>{speakerOn ? "Hoparlör Açık" : "Hoparlör"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
          <Feather name="phone-off" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing2: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nameSection: { alignItems: "center", gap: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  callStatus: { color: "#ffffff80", fontSize: 16, fontFamily: "Inter_400Regular" },
  controls: { paddingHorizontal: 40, gap: 32 },
  topControls: { flexDirection: "row", justifyContent: "center", gap: 24 },
  ctrlBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ctrlLabel: { color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular" },
  hangupBtn: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
});
