import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToGroupMessages,
  sendGroupMessage,
  type ChatMessage,
  type Group,
} from "@/services/chatService";
import { MessageBubble } from "@/components/MessageBubble";

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "groups", id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGroup({
          id: snap.id,
          name: data.name ?? "",
          description: data.description ?? "",
          photoURL: data.photoURL ?? null,
          createdBy: data.createdBy ?? "",
          members: data.members ?? [],
          admins: data.admins ?? [],
          lastMessage: data.lastMessage ?? "",
          lastMessageTime: data.lastMessageTime?.toMillis?.() ?? 0,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        });
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToGroupMessages(id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleSend = useCallback(async (
    mediaUri?: string,
    mediaType?: "image" | "file",
    fileName?: string
  ) => {
    if (!profile || !id) return;
    const msg = text.trim();
    if (!msg && !mediaUri) return;
    setText("");
    setSending(true);
    try {
      await sendGroupMessage(id, profile.uid, profile.name, msg, mediaUri, mediaType, fileName);
    } catch {
      Alert.alert("Hata", "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }, [text, profile, id]);

  const handleImagePick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    await handleSend(asset.uri, "image", asset.fileName ?? "photo.jpg");
  };

  const handleFilePick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    await handleSend(asset.uri, "file", asset.name);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.groupIcon, { backgroundColor: colors.accent }]}>
            <Feather name="users" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
              {group?.name ?? "Grup"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {group?.members.length ?? 0} üye
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        ) : (
          <FlatList
            ref={flatRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            renderItem={({ item }) => (
              <MessageBubble message={item} isMe={item.senderId === profile?.uid} showName />
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: botPad + 8 }]}>
          <TouchableOpacity onPress={handleImagePick} style={styles.attachBtn}>
            <Feather name="image" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFilePick} style={styles.attachBtn}>
            <Feather name="paperclip" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={() => handleSend()}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  groupIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 16, maxWidth: 200 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  attachBtn: { padding: 6, paddingBottom: 10 },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
