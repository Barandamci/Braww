import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { subscribeToGroups, type Group } from "@/services/chatService";

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

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToGroups(profile.uid, setGroups);
    return unsub;
  }, [profile?.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Gruplar</Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push("/new-group")}
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groupItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/group/${item.id}`)}
            activeOpacity={0.7}
          >
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={[styles.groupAvatar, { borderRadius: 27 }]} />
            ) : (
              <View style={[styles.groupAvatar, { backgroundColor: colors.accent, borderRadius: 27, alignItems: "center", justifyContent: "center" }]}>
                <Feather name="users" size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.groupInfo}>
              <View style={styles.groupTopRow}>
                <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>
                  {formatTime(item.lastMessageTime)}
                </Text>
              </View>
              <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.lastMessage || `${item.members.length} üye`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz grup yok</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              + butonuna basarak yeni grup oluştur
            </Text>
          </View>
        }
        contentContainerStyle={groups.length === 0 && styles.emptyContainer}
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupAvatar: { width: 54, height: 54 },
  groupInfo: { flex: 1, gap: 4 },
  groupTopRow: { flexDirection: "row", justifyContent: "space-between" },
  groupName: { fontFamily: "Inter_600SemiBold", fontSize: 16, flex: 1 },
  time: { fontFamily: "Inter_400Regular", fontSize: 12 },
  lastMsg: { fontFamily: "Inter_400Regular", fontSize: 14 },
  empty: { alignItems: "center", gap: 10, paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
