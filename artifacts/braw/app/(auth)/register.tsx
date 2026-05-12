import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/services/apiConfig";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      Alert.alert("Hata", "Tüm alanları doldurun.");
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert("Hata", "Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Hata", "Geçerli bir e-posta girin.");
      return;
    }
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Hata", data.error ?? "Kod gönderilemedi.");
        return;
      }
      router.push({
        pathname: "/(auth)/verify-otp",
        params: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
        },
      });
    } catch {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>Hesap Oluştur</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Braw'a katılmak için bilgilerini gir
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Ad Soyad</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Adın ve soyadın"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Kullanıcı Adı</Text>
            <View style={styles.usernameRow}>
              <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
              <TextInput
                style={[styles.input, styles.usernameInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="kullanici_adi"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>E-posta</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="ornek@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Şifre</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="En az 6 karakter"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={[styles.eyeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Doğrulama Kodu Gönder</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            E-postana 6 haneli doğrulama kodu gönderilecek
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>
            Zaten hesabın var mı?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, gap: 32 },
  backBtn: { alignSelf: "flex-start", padding: 4 },
  header: { alignItems: "center", gap: 10 },
  logo: { width: 70, height: 70, borderRadius: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  atSign: { fontSize: 20, fontFamily: "Inter_500Medium" },
  usernameInput: { flex: 1 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  passwordInput: { flex: 1 },
  eyeBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  link: { textAlign: "center", fontSize: 15, fontFamily: "Inter_400Regular" },
});
