import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/services/apiConfig";

export default function VerifyOtpScreen() {
  const { email, name, username, password } = useLocalSearchParams<{
    email: string;
    name: string;
    username: string;
    password: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (value: string, index: number) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);
    if (cleaned && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      Alert.alert("Hata", "6 haneli kodu girin.");
      return;
    }
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.toLowerCase(), code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Hata", data.error ?? "Doğrulama başarısız.");
        return;
      }
      await register(name ?? "", username ?? "", email ?? "", password ?? "");
    } catch {
      Alert.alert("Hata", "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const base = getApiBaseUrl();
      await fetch(`${base}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.toLowerCase() }),
      });
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      Alert.alert("Gönderildi", "Yeni kod e-postanıza gönderildi.");
    } catch {
      Alert.alert("Hata", "Kod gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  const topPad = Platform.OS === "web" ? 50 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="mail" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>E-postanı Doğrula</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
              {email}
            </Text>
            {"\n"}adresine 6 haneli kod gönderdik
          </Text>
        </View>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.card,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Doğrula ve Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, { opacity: countdown > 0 ? 0.5 : 1 }]}
          onPress={handleResend}
          disabled={countdown > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
              {countdown > 0
                ? `Yeniden gönder (${countdown}s)`
                : "Kodu yeniden gönder"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28 },
  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 32 },
  headerSection: { alignItems: "center", gap: 14, marginBottom: 40 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 32,
  },
  codeBox: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  btn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  resendBtn: { alignItems: "center", paddingVertical: 8 },
  resendText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
