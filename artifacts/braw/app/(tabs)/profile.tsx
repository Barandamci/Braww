import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { uploadProfilePhoto } from "@/services/chatService";
import { updateUserProfile } from "@/services/userService";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, logout, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.name ?? "");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!profile) return;
    setUploading(true);
    try {
      await uploadProfilePhoto(profile.uid, result.assets[0].uri);
      await refreshProfile();
    } catch {
      Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!profile || !newName.trim()) return;
    await updateUserProfile(profile.uid, { name: newName.trim() });
    await refreshProfile();
    setEditingName(false);
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istiyor musun?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış", style: "destructive", onPress: logout },
    ]);
  };

  if (!profile) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrapper}>
            {uploading ? (
              <View style={[styles.avatarLoading, { backgroundColor: colors.card }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <UserAvatar photoURL={profile.photoURL} name={profile.name} size={96} />
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
                {profile.verified && <VerifiedBadge verified={profile.verified} size={20} />}
                <TouchableOpacity onPress={() => { setNewName(profile.name); setEditingName(true); }}>
                  <Feather name="edit-2" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{profile.email}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.cardRow, { borderBottomColor: colors.border }]}>
            <Feather name="user" size={20} color={colors.primary} />
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Ad Soyad</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{profile.name}</Text>
            </View>
          </View>
          <View style={[styles.cardRow, { borderBottomColor: colors.border }]}>
            <Feather name="at-sign" size={20} color={colors.primary} />
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Kullanıcı Adı</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>@{profile.username}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Feather name="mail" size={20} color={colors.primary} />
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>E-posta</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{profile.email}</Text>
            </View>
          </View>
        </View>

        {profile.verified && (
          <View style={[styles.verifiedCard, { backgroundColor: profile.verified === "blue" ? colors.accent : colors.card, borderColor: profile.verified === "blue" ? colors.primary : colors.border }]}>
            <VerifiedBadge verified={profile.verified} size={22} />
            <Text style={[styles.verifiedText, { color: profile.verified === "blue" ? colors.primary : colors.foreground }]}>
              {profile.verified === "blue" ? "Mavi tik doğrulanmış hesap" : "Siyah tik doğrulanmış hesap"}
            </Text>
          </View>
        )}

        {profile.isAdmin && (
          <View style={[styles.adminBadge, { backgroundColor: colors.accent }]}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={[styles.adminText, { color: colors.primary }]}>Admin Hesabı</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  avatarSection: { alignItems: "center", gap: 8 },
  avatarWrapper: { position: "relative" },
  avatarLoading: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  username: { fontSize: 15, fontFamily: "Inter_400Regular" },
  email: { fontSize: 14, fontFamily: "Inter_400Regular" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minWidth: 140,
  },
  saveBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  verifiedText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  adminText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
