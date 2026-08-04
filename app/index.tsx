import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FuryRing from "../components/fury-ring";

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return <FuryRing />;
  }

  return (
    <ImageBackground
      source={{ uri: "/nightsky.png" }}
      resizeMode="cover"
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={{ uri: "/fury-logo.svg" }}
          resizeMode="contain"
          style={styles.logo}
        />

        <Pressable style={styles.primaryButton} onPress={() => setIsPlaying(true)}>
          <Text style={styles.primaryButtonText}>START SPILL</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>INFO</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>© 2026 Morning Coffee Labs</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#02050d",
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: "78%",
    maxWidth: 420,
    aspectRatio: 1.16,
    marginBottom: 34,
  },
  primaryButton: {
    width: "78%",
    maxWidth: 320,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFB000",
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#08111f",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  secondaryButton: {
    marginTop: 16,
    minWidth: 130,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#6FE7FF",
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: "#F7FAFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    color: "rgba(247,250,255,0.72)",
    fontSize: 12,
  },
});