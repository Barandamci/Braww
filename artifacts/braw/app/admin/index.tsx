import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  getAllUsers,
  setVerified,
  banUser,
  unbanUser,
  makeAdmin,
  removeAdmin,
} from "@/services/adminService";
import { isOwnerEmail } from "@/constants/owner";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/context/AuthContext";

export default function AdminPanel() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState<{ user: UserProfile } | null>(null);
  const [banReason, setBanReason] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!profile?.isOwner) {
      router.replace("/(tabs)/chats");
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      all.sort((a, b) => {
        if (isOwnerEmail(a.email)) return -1;
        if (isOwnerEmail(b.email)) return 1;
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return a.name.localeCompare(b.name);
      });
      setUsers(all);
      setFiltered(all);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(users); return; }
    const lower = text.toLowerCase();
    setFiltered(users.filter((u) =>
      u.name.toLowerCase().includes(lower) ||
      u.username.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower)
    ));
  };

  const handleSetVerified = (user: UserProfile, type: "blue" | "black" | null) => {
    const label = type === "blue" ? "Mavi Tik" : type === "black" ? "Siyah Tik" : "Tik Kaldır";
    Alert.alert(label, `${user.name} kullanıcısına "${label}" verilsin mi?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Onayla",
        onPress: async () => {
          await setVerified(user.uid, type);
          await loadUsers();
        },
      },
    ]);
  };

  const handleBan = async () => {
    if (!banModal) return;
    if (!banReason.trim()) { Alert.alert("Hata", "Ban sebebi girin."); return; }
    try {
      await banUser(banModal.user.uid, banReason.trim());
      setBanModal(null);
      setBanReason("");
      await loadUsers();
    } catch (e: any) {
      if (e?.message === "OWNER_PROTECTED") {
        Alert.alert("İzin Yok", "Owner hesabı banlanamaz.");
      } else {
        Alert.alert("Hata", "İşlem başarısız.");
      }
    }
  };

  const handleUnban = (user: UserProfile) => {
    Alert.alert("Banı Kaldır", `${user.name} kullanıcısının banı kaldırılsın mı?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        onPress: async () => {
          await unbanUser(user.uid);
          await loadUsers();
        },
      },
    ]);
  };

  const handleToggleAdmin = (user: UserProfile) => {
    if (isOwnerEmail(user.email)) return;
    const action = user.isAdmin ? "Admin Kaldır" : "Admin Yap";
    Alert.alert(action, `${user.name} kullanıcısı ${user.isAdmin ? "adminlikten çıkarılsın" : "admin yapılsın"} mı?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Onayla",
        onPress: async () => {
          if (user.isAdmin) {
            await removeAdmin(user.uid);
          } else {
            await makeAdmin(user.uid);
          }
          await loadUsers();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Feather name="shield" size={20} color="#FFD700" />
          <Text style={[styles.title, { color: colors.foreground }]}>Owner Panel</Text>
        </View>
        <TouchableOpacity onPress={loadUsers} style={styles.backBtn}>
          <Feather name="refresh-cw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Kullanıcı ara..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => {
            const isOwner = isOwnerEmail(item.email);
            return (
              <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: isOwner ? "#FFD700" : colors.border }]}>
                <View style={styles.userTop}>
                  <UserAvatar photoURL={item.photoURL} name={item.name} size={46} />
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                      {item.verified && <VerifiedBadge verified={item.verified} size={14} />}
                      {isOwner && (
                        <View style={[styles.roleTag, { backgroundColor: "#FFD70025" }]}>
                          <Text style={[styles.tagText, { color: "#FFD700" }]}>👑 Owner</Text>
                        </View>
                      )}
                      {!isOwner && item.isAdmin && (
                        <View style={[styles.roleTag, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>Admin</Text>
                        </View>
                      )}
                      {item.isBanned && (
                        <View style={[styles.roleTag, { backgroundColor: "#FF3B3020" }]}>
                          <Text style={[styles.tagText, { color: "#FF3B30" }]}>Banlı</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.username, { color: colors.mutedForeground }]}>@{item.username}</Text>
                    <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>{item.email}</Text>
                    {item.isBanned && item.banReason && (
                      <Text style={[styles.bannedLabel, { color: colors.destructive }]}>
                        Sebep: {item.banReason}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.blueTick + "20" }]}
                    onPress={() => handleSetVerified(item, "blue")}
                  >
                    <Text style={[styles.actionText, { color: colors.blueTick }]}>Mavi Tik</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => handleSetVerified(item, "black")}
                  >
                    <Text style={[styles.actionText, { color: colors.foreground }]}>Siyah Tik</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.muted }]}
                    onPress={() => handleSetVerified(item, null)}
                  >
                    <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Tik Kaldır</Text>
                  </TouchableOpacity>

                  {!isOwner && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: item.isAdmin ? "#FF950020" : "#1A6DFF20" }]}
                      onPress={() => handleToggleAdmin(item)}
                    >
                      <Feather
                        name={item.isAdmin ? "user-minus" : "user-plus"}
                        size={13}
                        color={item.isAdmin ? "#FF9500" : colors.primary}
                      />
                      <Text style={[styles.actionText, { color: item.isAdmin ? "#FF9500" : colors.primary }]}>
                        {item.isAdmin ? "Admin Kaldır" : "Admin Yap"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#1A6DFF15" }]}
                    onPress={() => router.push(`/admin/user/${item.uid}`)}
                  >
                    <Feather name="eye" size={13} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Mesajlar</Text>
                  </TouchableOpacity>

                  {!isOwner && (
                    item.isBanned ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#34C75920" }]}
                        onPress={() => handleUnban(item)}
                      >
                        <Text style={[styles.actionText, { color: "#34C759" }]}>Banı Kaldır</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.destructive + "20" }]}
                        onPress={() => { setBanModal({ user: item }); setBanReason(""); }}
                      >
                        <Text style={[styles.actionText, { color: colors.destructive }]}>Banla</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!banModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Kullanıcıyı Banla
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              {banModal?.user.name} — @{banModal?.user.username}
            </Text>
            <TextInput
              style={[styles.banInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Ban sebebini yaz..."
              placeholderTextColor={colors.mutedForeground}
              value={banReason}
              onChangeText={setBanReason}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setBanModal(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.destructive }]}
                onPress={handleBan}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Banla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  userCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  userTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  userInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  username: { fontFamily: "Inter_400Regular", fontSize: 13 },
  email: { fontFamily: "Inter_400Regular", fontSize: 11 },
  bannedLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  roleTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox: { width: "100%", borderRadius: 18, padding: 20, gap: 14, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  banInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
