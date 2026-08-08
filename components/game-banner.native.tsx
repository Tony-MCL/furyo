import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";
import { canRequestAds } from "./ad-consent";

const BANNER_AD_UNIT_ID = Platform.select({
  android: "ca-app-pub-7463440033205599/7216505370",
  ios: "ca-app-pub-7463440033205599/7945584957",
})!;

export default function GameBanner() {
  if (!canRequestAds()) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
