import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";

export interface BannerData {
  id: string;
  title: string;
  body: string;
  photoURL?: string | null;
  onPress?: () => void;
}

interface Props {
  banner: BannerData;
  onDismiss: (id: string) => void;
}

export function InAppNotificationBanner({ banner, onDismiss }: Props) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const dismissTimer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(dismissTimer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(banner.id));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={() => {
          banner.onPress?.();
          dismiss();
        }}
        activeOpacity={0.85}
      >
        <UserAvatar
          photoURL={banner.photoURL}
          name={banner.title}
          size={44}
        />
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={1}>
            {banner.body}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Text style={{ color: colors.mutedForeground, fontSize: 18, lineHeight: 20 }}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    zIndex: 9998,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    marginTop: 52,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  textSection: { flex: 1 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  body: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
});
