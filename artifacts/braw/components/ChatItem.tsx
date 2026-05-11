import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface Props {
  name: string;
  lastMessage: string;
  time: number;
  photoURL?: string | null;
  verified?: "blue" | "black" | null;
  onPress: () => void;
  isBanned?: boolean;
}

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Şimdi";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function ChatItem({ name, lastMessage, time, photoURL, verified, onPress, isBanned }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <UserAvatar photoURL={photoURL} name={name} size={54} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {name}
            </Text>
            {verified && <VerifiedBadge verified={verified} size={15} />}
            {isBanned && (
              <View style={[styles.bannedTag, { backgroundColor: colors.destructive }]}>
                <Text style={styles.bannedText}>Banlı</Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(time)}
          </Text>
        </View>
        <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
          {lastMessage || "Sohbeti başlat..."}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  preview: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  bannedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
});
