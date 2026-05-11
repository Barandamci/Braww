import React from "react";
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { ChatMessage } from "@/services/chatService";

interface Props {
  message: ChatMessage;
  isMe: boolean;
  showName?: boolean;
}

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isMe, showName }: Props) {
  const colors = useColors();

  const bubbleStyle = {
    backgroundColor: isMe ? colors.messageBubble : colors.messageOther,
    borderRadius: 18,
    borderBottomRightRadius: isMe ? 4 : 18,
    borderBottomLeftRadius: isMe ? 18 : 4,
  };

  const textColor = isMe ? colors.messageBubbleText : colors.messageOtherText;

  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, bubbleStyle]}>
        {showName && !isMe && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {message.senderName}
          </Text>
        )}
        {message.type === "image" && message.mediaUrl ? (
          <Image
            source={{ uri: message.mediaUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : message.type === "file" && message.mediaUrl ? (
          <TouchableOpacity
            style={[styles.fileRow, { backgroundColor: isMe ? "rgba(255,255,255,0.15)" : colors.border }]}
            onPress={() => message.mediaUrl && Linking.openURL(message.mediaUrl)}
          >
            <Feather name="file" size={20} color={textColor} />
            <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
              {message.fileName ?? "Dosya"}
            </Text>
          </TouchableOpacity>
        ) : null}
        {message.text ? (
          <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>
        ) : null}
        <Text style={[styles.time, { color: isMe ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  senderName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    alignSelf: "flex-end",
  },
  image: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  fileName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
  },
});
