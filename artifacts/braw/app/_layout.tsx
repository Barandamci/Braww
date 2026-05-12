import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationLayer } from "@/components/NotificationLayer";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)/chats");
    }
  }, [user, loading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1 }}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/user/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="admin/conversation/[chatId]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="new-group" options={{ headerShown: false }} />
        <Stack.Screen name="voice-call/[id]" options={{ headerShown: false }} />
      </Stack>
      <NotificationLayer />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
      Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
      Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
      Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
    })
      .catch(() => {})
      .finally(() => {
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <NotificationProvider>
                  <RootLayoutNav />
                </NotificationProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
