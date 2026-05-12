import { Platform } from "react-native";

export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}`;
  }
  if (Platform.OS === "web") {
    return "";
  }
  return "http://localhost:5000";
}
