import React from "react";
import {
  Image,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { SvgUri } from "react-native-svg";

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
  logo: require("../public/fury-logo.svg"),
  "game-over": require("../public/fury-game-over.svg"),
};

export default function FuryArtwork({ kind, style }: FuryArtworkProps) {
  if (Platform.OS === "web") {
    return (
      <View style={style}>
        <Image
          source={{ uri: WEB_URIS[kind] }}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  const resolvedAsset = Image.resolveAssetSource(NATIVE_ASSETS[kind]);

  if (!resolvedAsset?.uri) {
    return <View style={style} />;
  }

  return (
    <View style={style}>
      <SvgUri
        width="100%"
        height="100%"
        uri={resolvedAsset.uri}
      />
    </View>
  );
}
