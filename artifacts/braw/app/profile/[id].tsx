import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { getUserById } from "@/services/userService";
import { getOrCreateChat } from "@/services/chatService";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/context/AuthContext";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    getUserById(id).then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [id]);

  const handleOpenChat = async () => {
    if (!profile || !user) return;
    const chatId = await getOrCreateChat(profile.uid, user.uid);
    router.push(`/chat/${chatId}`);
  };

  const handleVoiceCall = () => {
    if (!user) return;
    router.push(`/voice-call/${user.uid}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : !user ? (
        <View style={styles.empty}>
          <Feather name="user-x" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Kullanıcı bulunamadı</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <UserAvatar photoURL={user.photoURL} name={user.name} size={100} />
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
              {user.verified && <VerifiedBadge verified={user.verified} size={22} />}
            </View>
            <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user.username}</Text>
            {user.isBanned && (
              <View style={[styles.bannedBadge, { backgroundColor: colors.destructive + "20" }]}>
                <Text style={[styles.bannedText, { color: colors.destructive }]}>
                  Bu hesap banlı
                </Text>
              </View>
            )}
          </View>

          {profile?.uid !== user.uid && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleOpenChat}
              >
                <Feather name="message-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Mesaj Gönder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={handleVoiceCall}
              >
                <Feather name="phone" size={20} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Sesli Ara</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.cardRow, { borderBottomColor: colors.border }]}>
              <Feather name="user" size={20} color={colors.primary} />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Ad Soyad</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>{user.name}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <Feather name="at-sign" size={20} color={colors.primary} />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Kullanıcı Adı</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>@{user.username}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    justifyContent: "space-between",
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 24, gap: 20, paddingBottom: 100 },
  avatarSection: { alignItems: "center", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  username: { fontSize: 15, fontFamily: "Inter_400Regular" },
  bannedBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  bannedText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  actionBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  card: { borderRadius: 16, overflow: "hidden" },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  cardValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", gap: 10, paddingTop: 80 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
