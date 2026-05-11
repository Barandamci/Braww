import React from "react";
import { Image } from "react-native";

interface Props {
  verified: "blue" | "black" | null;
  size?: number;
}

export function VerifiedBadge({ verified, size = 16 }: Props) {
  if (!verified) return null;
  return (
    <Image
      source={
        verified === "blue"
          ? require("@/assets/images/blue-tick.png")
          : require("@/assets/images/black-tick.png")
      }
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
