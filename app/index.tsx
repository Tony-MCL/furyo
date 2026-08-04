import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FuryRing from "../components/fury-ring";
import {
  FURY_DIFFICULTIES,
  FURY_DIFFICULTY_ORDER,
  type FuryDifficulty,
} from "../components/fury-difficulty";

const REVIVE_STORAGE_KEY = "fury-o-revives";
const MAX_REVIVES = 3;

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [difficulty, setDifficulty] = useState<FuryDifficulty>("normal");
  const [revives, setRevives] = useState(0);

  const loadRevives = useCallback(async () => {
    try {
      const storedValue = await AsyncStorage.getItem(REVIVE_STORAGE_KEY);
      if (storedValue === null) {
        return;
      }

      const parsed = Number.parseInt(storedValue, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }

      setRevives(Math.min(MAX_REVIVES, Math.max(0, parsed)));
    } catch {
      // Revive persistence should never block the Home screen.
    }
  }, []);

  useEffect(() => {
    loadRevives();
  }, [loadRevives]);

  const earnTestRevive = useCallback(() => {
    setRevives((current) => {
      const next = Math.min(MAX_REVIVES, current + 1);
      AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(next)).catch(() => {
        // Keep the UI responsive even if storage is unavailable.
      });
      return next;
    });
  }, []);

  if (isPlaying) {
    return (
      <FuryRing
        difficulty={difficulty}
        onHome={() => {
          setIsPlaying(false);
          void loadRevives();
        }}
      />
    );
  }

  if (showInfo) {
    return (
      <ImageBackground
        source={{ uri: "/nightsky.png" }}
        resizeMode="cover"
        style={styles.container}
      >
        <Pressable style={styles.backButton} onPress={() => setShowInfo(false)}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.infoContent}>
          <Image
            source={{ uri: "/fury-logo.svg" }}
            resizeMode="contain"
            style={styles.infoLogo}
          />

          <Text style={styles.infoTitle}>INFO</Text>

          <Text style={styles.infoText}>
            Flytt ringen. Kontroller åpningen. Overlev så lenge du kan.
          </Text>
          <Text style={styles.infoText}>
            Dra opp og ned for å flytte ringen, og trykk for å snu
            rotasjonsretningen.
          </Text>
          <Text style={styles.infoText}>
            Spis vanlige baller gjennom åpningen for bonuspoeng — men ikke bli
            for grådig.
          </Text>

          <View style={styles.infoLinks}>
            <Pressable style={styles.infoLinkButton}>
              <Text style={styles.infoLinkText}>Privacy Policy</Text>
            </Pressable>
            <Pressable style={styles.infoLinkButton}>
              <Text style={styles.infoLinkText}>Terms of Use</Text>
            </Pressable>
            <Pressable style={styles.infoLinkButton}>
              <Text style={styles.infoLinkText}>Contact</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>© 2026 Morning Coffee Labs</Text>
      </ImageBackground>
    );
  }

  const reviveFull = revives >= MAX_REVIVES;

  return (
    <ImageBackground
      source={{ uri: "/nightsky.png" }}
      resizeMode="cover"
      style={styles.container}
    >
      <Pressable style={styles.infoButton} onPress={() => setShowInfo(true)}>
        <Text style={styles.infoButtonText}>i</Text>
      </Pressable>

      <View style={styles.content}>
        <Image
          source={{ uri: "/fury-logo.svg" }}
          resizeMode="contain"
          style={styles.logo}
        />

        <View style={styles.revivePanel}>
          <Text style={styles.reviveCount}>REVIVES {revives}/{MAX_REVIVES}</Text>
          <Pressable
            disabled={reviveFull}
            style={[
              styles.earnReviveButton,
              reviveFull && styles.earnReviveButtonDisabled,
            ]}
            onPress={earnTestRevive}
          >
            <Text
              style={[
                styles.earnReviveButtonText,
                reviveFull && styles.earnReviveButtonTextDisabled,
              ]}
            >
              {reviveFull ? "REVIVES FULL" : "EARN REVIVE"}
            </Text>
          </Pressable>
          <Text style={styles.reviveHint}>Rewarded ad kobles på senere</Text>
        </View>

        <Text style={styles.difficultyLabel}>VANSKELIGHETSGRAD</Text>

        <View style={styles.difficultyRow}>
          {FURY_DIFFICULTY_ORDER.map((option) => {
            const selected = option === difficulty;

            return (
              <Pressable
                key={option}
                style={[
                  styles.difficultyButton,
                  selected && styles.difficultyButtonSelected,
                ]}
                onPress={() => setDifficulty(option)}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    selected && styles.difficultyButtonTextSelected,
                  ]}
                >
                  {FURY_DIFFICULTIES[option].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setIsPlaying(true)}>
          <Text style={styles.primaryButtonText}>START SPILL</Text>
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
    paddingHorizontal: 24,
  },
  logo: {
    width: "72%",
    maxWidth: 390,
    aspectRatio: 1.16,
    marginBottom: 14,
  },
  revivePanel: {
    width: "78%",
    maxWidth: 320,
    alignItems: "center",
    marginBottom: 22,
  },
  reviveCount: {
    color: "#FFD166",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  earnReviveButton: {
    width: "100%",
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6FE7FF",
    backgroundColor: "rgba(111,231,255,0.08)",
    paddingHorizontal: 16,
  },
  earnReviveButtonDisabled: {
    borderColor: "rgba(247,250,255,0.2)",
    backgroundColor: "rgba(247,250,255,0.04)",
  },
  earnReviveButtonText: {
    color: "#6FE7FF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  earnReviveButtonTextDisabled: {
    color: "rgba(247,250,255,0.4)",
  },
  reviveHint: {
    marginTop: 6,
    color: "rgba(247,250,255,0.45)",
    fontSize: 10,
  },
  difficultyLabel: {
    color: "rgba(247,250,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  difficultyRow: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  difficultyButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(111,231,255,0.45)",
    backgroundColor: "rgba(2,5,13,0.5)",
    paddingHorizontal: 6,
  },
  difficultyButtonSelected: {
    borderColor: "#FFB000",
    backgroundColor: "rgba(255,176,0,0.13)",
  },
  difficultyButtonText: {
    color: "rgba(247,250,255,0.76)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  difficultyButtonTextSelected: {
    color: "#FFB000",
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
  infoButton: {
    position: "absolute",
    top: 42,
    right: 22,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#6FE7FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  infoButtonText: {
    color: "#F7FAFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24,
  },
  backButton: {
    position: "absolute",
    top: 38,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#6FE7FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backButtonText: {
    color: "#F7FAFF",
    fontSize: 38,
    fontWeight: "500",
    lineHeight: 39,
    marginTop: -3,
  },
  infoContent: {
    width: "100%",
    maxWidth: 520,
    alignItems: "center",
    paddingHorizontal: 34,
  },
  infoLogo: {
    width: "42%",
    maxWidth: 190,
    aspectRatio: 1.16,
    marginBottom: 12,
  },
  infoTitle: {
    color: "#FFB000",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 26,
  },
  infoText: {
    width: "100%",
    color: "#F7FAFF",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 13,
  },
  infoLinks: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
  },
  infoLinkButton: {
    width: "82%",
    maxWidth: 300,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(111,231,255,0.35)",
  },
  infoLinkText: {
    color: "#6FE7FF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    color: "rgba(247,250,255,0.72)",
    fontSize: 12,
  },
});