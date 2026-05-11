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
import { getChatMessages } from "@/services/adminService";
import { MessageBubble } from "@/components/MessageBubble";
import type { ChatMessage } from "@/services/chatService";

export default function AdminConversation() {
  const { chatId, userId } = useLocalSearchParams<{ chatId: string; userId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!chatId) return;
    getChatMessages(chatId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [chatId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Feather name="eye" size={18} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mesajları İncele</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.adminText, { color: colors.primary }]}>Admin Görünümü</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === userId} showName />
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Hiç mesaj yok</Text>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 6 },
  headerTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  adminBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  empty: { alignItems: "center", gap: 10, paddingTop: 80 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
