import React from "react";
import { View, StyleSheet } from "react-native";
import { useNotifications } from "@/context/NotificationContext";
import { InAppNotificationBanner } from "@/components/InAppNotificationBanner";
import { IncomingCallOverlay } from "@/components/IncomingCallOverlay";

export function NotificationLayer() {
  const { banners, dismissBanner, incomingCall, dismissCall } = useNotifications();

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {incomingCall && (
        <IncomingCallOverlay call={incomingCall} onDismiss={dismissCall} />
      )}
      {!incomingCall &&
        banners.map((banner) => (
          <InAppNotificationBanner
            key={banner.id}
            banner={banner}
            onDismiss={dismissBanner}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
});
