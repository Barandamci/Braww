import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { subscribeToChats, type Chat } from "@/services/chatService";
import { getUserById } from "@/services/userService";
import { ChatItem } from "@/components/ChatItem";
import type { UserProfile } from "@/context/AuthContext";

export default function ChatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [userCache, setUserCache] = useState<Record<string, UserProfile>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToChats(profile.uid, (c) => setChats(c));
    return unsub;
  }, [profile?.uid]);

  useEffect(() => {
    const allUids = chats.flatMap((c) => c.participants);
    const missing = [...new Set(allUids)].filter((u) => !userCache[u]);
    if (missing.length === 0) return;
    Promise.all(missing.map((u) => getUserById(u))).then((results) => {
      const updates: Record<string, UserProfile> = {};
      results.forEach((r, i) => { if (r) updates[missing[i]] = r; });
      setUserCache((prev) => ({ ...prev, ...updates }));
    });
  }, [chats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Sohbetler</Text>
        <View style={styles.headerActions}>
          {profile?.isAdmin && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={() => router.push("/admin/index")}
            >
              <Feather name="shield" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/search")}
          >
            <Feather name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherId = item.participants.find((p) => p !== profile?.uid) ?? "";
          const other = userCache[otherId];
          return (
            <ChatItem
              name={other?.name ?? item.participantNames[otherId] ?? "Kullanıcı"}
              lastMessage={item.lastMessage}
              time={item.lastMessageTime}
              photoURL={other?.photoURL}
              verified={other?.verified}
              isBanned={other?.isBanned}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz sohbet yok</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Kullanıcı arayarak sohbet başlat
            </Text>
          </View>
        }
        contentContainerStyle={chats.length === 0 && styles.emptyContainer}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", gap: 10, paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
