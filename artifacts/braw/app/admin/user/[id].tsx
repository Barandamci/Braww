import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getUserById } from "@/services/userService";
import { getUserChats } from "@/services/adminService";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/context/AuthContext";
import type { Chat } from "@/services/chatService";

export default function AdminUserChats() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherProfiles, setOtherProfiles] = useState<Record<string, UserProfile>>({});
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    Promise.all([getUserById(id), getUserChats(id)]).then(async ([u, c]) => {
      setUser(u);
      setChats(c);
      const otherUids = c.flatMap((ch) => ch.participants.filter((p) => p !== id));
      const unique = [...new Set(otherUids)];
      const profiles = await Promise.all(unique.map((uid) => getUserById(uid)));
      const map: Record<string, UserProfile> = {};
      profiles.forEach((p, i) => { if (p) map[unique[i]] = p; });
      setOtherProfiles(map);
      setLoading(false);
    });
  }, [id]);

  function formatTime(ts: number): string {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {user && <UserAvatar photoURL={user.photoURL} name={user.name} size={36} />}
          <View>
            <View style={styles.nameRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {user?.name ?? "Kullanıcı"}
              </Text>
              {user?.verified && <VerifiedBadge verified={user.verified} size={14} />}
            </View>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Konuşmaları</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherId = item.participants.find((p) => p !== id) ?? "";
            const other = otherProfiles[otherId];
            return (
              <TouchableOpacity
                style={[styles.chatRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/admin/conversation/${item.id}?userId=${id}`)}
                activeOpacity={0.7}
              >
                <UserAvatar photoURL={other?.photoURL} name={other?.name ?? "?"} size={48} />
                <View style={styles.chatInfo}>
                  <View style={styles.chatNameRow}>
                    <Text style={[styles.chatName, { color: colors.foreground }]}>
                      {other?.name ?? item.participantNames[otherId] ?? "Kullanıcı"}
                    </Text>
                    {other?.verified && <VerifiedBadge verified={other.verified} size={13} />}
                  </View>
                  <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.lastMessage || "Sohbet başlatılmış"}
                  </Text>
                </View>
                <View style={styles.chatRight}>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                  <Feather name="eye" size={18} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Hiç sohbet yok</Text>
            </View>
          }
          contentContainerStyle={chats.length === 0 && styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  chatInfo: { flex: 1, gap: 4 },
  chatNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  chatName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  lastMsg: { fontFamily: "Inter_400Regular", fontSize: 13 },
  chatRight: { alignItems: "flex-end", gap: 6 },
  time: { fontFamily: "Inter_400Regular", fontSize: 12 },
  empty: { alignItems: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  emptyContainer: { flex: 1 },
});
