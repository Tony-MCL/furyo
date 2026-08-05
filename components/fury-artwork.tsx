import React from "react";
import {
  Image,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

type FuryArtworkKind = "logo" | "game-over";

type FuryArtworkProps = {
  kind: FuryArtworkKind;
  style?: StyleProp<ViewStyle>;
};

const WEB_URIS: Record<FuryArtworkKind, string> = {
  logo: "/fury-logo.svg",
  "game-over": "/fury-game-over.svg",
};

const NATIVE_ASSETS: Record<FuryArtworkKind, number> = {
  logo: require("../public/fury-logo.png"),
  "game-over": require("../public/fury-game-over.png"),
};

export default function FuryArtwork({ kind, style }: FuryArtworkProps) {
  return (
    <View style={style}>
      <Image
        source={
          Platform.OS === "web"
            ? { uri: WEB_URIS[kind] }
            : NATIVE_ASSETS[kind]
        }
        resizeMode="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
