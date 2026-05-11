import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { searchUsersByUsername } from "@/services/userService";
import { createGroup } from "@/services/chatService";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/context/AuthContext";

export default function NewGroupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (!text.trim()) { setSearchResults([]); return; }
    const res = await searchUsersByUsername(text.trim());
    setSearchResults(res.filter((u) => u.uid !== profile?.uid && !selected.some((s) => s.uid === u.uid)));
  };

  const toggleSelect = (user: UserProfile) => {
    setSelected((prev) =>
      prev.some((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { Alert.alert("Hata", "Grup adı girin."); return; }
    if (selected.length === 0) { Alert.alert("Hata", "En az 1 üye seçin."); return; }
    if (!profile) return;
    setCreating(true);
    try {
      const groupId = await createGroup(groupName.trim(), description.trim(), profile.uid, selected.map((u) => u.uid));
      router.replace(`/group/${groupId}`);
    } catch {
      Alert.alert("Hata", "Grup oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Yeni Grup</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary, opacity: creating ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createBtnText}>Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Grup Adı"
          placeholderTextColor={colors.mutedForeground}
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Açıklama (isteğe bağlı)"
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
        />

        {selected.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Seçilenler ({selected.length})
            </Text>
            <View style={styles.selectedChips}>
              {selected.map((u) => (
                <TouchableOpacity
                  key={u.uid}
                  style={[styles.chip, { backgroundColor: colors.accent }]}
                  onPress={() => toggleSelect(u)}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>{u.name}</Text>
                  <Feather name="x" size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Üye ekle..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => {
            const isSelected = selected.some((s) => s.uid === item.uid);
            return (
              <TouchableOpacity
                style={[styles.userRow, { borderBottomColor: colors.border, backgroundColor: isSelected ? colors.accent : "transparent" }]}
                onPress={() => toggleSelect(item)}
              >
                <UserAvatar photoURL={item.photoURL} name={item.name} size={42} />
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{item.name}</Text>
                    {item.verified && <VerifiedBadge verified={item.verified} size={13} />}
                  </View>
                  <Text style={[styles.userUsername, { color: colors.mutedForeground }]}>@{item.username}</Text>
                </View>
                {isSelected && <Feather name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
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
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  createBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { flex: 1, padding: 16, gap: 12 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  selectedSection: { gap: 6 },
  sectionLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  selectedChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  userUsername: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
