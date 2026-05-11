import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { searchUsersByUsername } from "@/services/userService";
import { getOrCreateChat } from "@/services/chatService";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/context/AuthContext";

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchUsersByUsername(text.trim());
      setResults(res.filter((u) => u.uid !== profile?.uid));
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [profile?.uid]);

  const openChat = async (other: UserProfile) => {
    if (!profile) return;
    const chatId = await getOrCreateChat(profile.uid, other.uid);
    router.push(`/chat/${chatId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Kullanıcı Ara</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Kullanıcı adıyla ara..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { borderBottomColor: colors.border }]}
              onPress={() => openChat(item)}
              activeOpacity={0.7}
            >
              <UserAvatar photoURL={item.photoURL} name={item.name} size={50} />
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                  {item.verified && <VerifiedBadge verified={item.verified} size={15} />}
                  {item.isBanned && (
                    <View style={[styles.bannedBadge, { backgroundColor: colors.destructive }]}>
                      <Text style={styles.bannedText}>Banlı</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.username, { color: colors.mutedForeground }]}>@{item.username}</Text>
              </View>
              <Feather name="message-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query ? (
              <View style={styles.empty}>
                <Feather name="user-x" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  "@{query}" ile kullanıcı bulunamadı
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Feather name="search" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Kullanıcı adıyla kişi bul
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  username: { fontFamily: "Inter_400Regular", fontSize: 14 },
  bannedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bannedText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", gap: 10, paddingTop: 50 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
