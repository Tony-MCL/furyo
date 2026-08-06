import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FuryArtwork from "../components/fury-artwork";
import FuryRing from "../components/fury-ring";
import GameBanner from "../components/game-banner";
import {
  FURY_DIFFICULTIES,
  FURY_DIFFICULTY_ORDER,
  type FuryDifficulty,
} from "../components/fury-difficulty";
import { strings } from "../components/i18n";
import {
  preloadRewardedRevive,
  showRewardedRevive,
} from "../components/rewarded-revive";

const REVIVE_STORAGE_KEY = "fury-o-revives";
const MAX_REVIVES = 3;
const GAME_OVER_TRANSITION_MS = 1000;
const PRIVACY_POLICY_URL = "https://morningcoffeelabs.no/#/fury-o/privacy";
const TERMS_OF_USE_URL = "https://morningcoffeelabs.no/#/fury-o/terms";
const CONTACT_URL = "mailto:post@morningcoffeelabs.no";
const COMMUNITY_URL = "https://www.facebook.com/groups/2506294439795765";
const NIGHT_SKY_SOURCE =
  Platform.OS === "web"
    ? { uri: "/nightsky.png" }
    : require("../public/nightsky.png");
const GAME_OVER_SOURCE =
  Platform.OS === "web"
    ? { uri: "/fury-game-over.svg" }
    : require("../public/fury-game-over.png");

type GameOverResult = {
  difficulty: FuryDifficulty;
  score: number;
  highScore: number;
};

export default function Page() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [difficulty, setDifficulty] = useState<FuryDifficulty>("normal");
  const [revives, setRevives] = useState(0);
  const [earningRevive, setEarningRevive] = useState(false);
  const [reviveMessage, setReviveMessage] = useState("");
  const [gameOverResult, setGameOverResult] = useState<GameOverResult | null>(null);
  const [gameOverTransitioning, setGameOverTransitioning] = useState(false);

  const gameOverProgress = useRef(new Animated.Value(0)).current;

  const loadRevives = useCallback(async () => {
    try {
      const storedValue = await AsyncStorage.getItem(REVIVE_STORAGE_KEY);
      if (storedValue === null) return;
      const parsed = Number.parseInt(storedValue, 10);
      if (!Number.isFinite(parsed)) return;
      setRevives(Math.min(MAX_REVIVES, Math.max(0, parsed)));
    } catch {}
  }, []);

  useEffect(() => {
    loadRevives();
    void preloadRewardedRevive();
  }, [loadRevives]);

  const earnRevive = useCallback(async () => {
    if (earningRevive || revives >= MAX_REVIVES) return;

    setEarningRevive(true);
    setReviveMessage("");

    try {
      const earned = await showRewardedRevive();
      if (!earned) {
        setReviveMessage(strings.noReviveEarned);
        return;
      }

      setRevives((current) => {
        const next = Math.min(MAX_REVIVES, current + 1);
        AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(next)).catch(() => {});
        return next;
      });
      setReviveMessage("");
    } catch {
      setReviveMessage(strings.adNotReady);
    } finally {
      setEarningRevive(false);
    }
  }, [earningRevive, revives]);

  const handleGameOver = useCallback((result: GameOverResult) => {
    setGameOverResult(result);
    setGameOverTransitioning(true);
    gameOverProgress.stopAnimation();
    gameOverProgress.setValue(0);

    Animated.timing(gameOverProgress, {
      toValue: 1,
      duration: GAME_OVER_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setGameOverTransitioning(false);
        setIsPlaying(false);
        void loadRevives();
      }
    });
  }, [gameOverProgress, loadRevives]);

  const startNewGame = useCallback(() => {
    gameOverProgress.stopAnimation();
    gameOverProgress.setValue(0);
    setGameOverResult(null);
    setGameOverTransitioning(false);
    setIsPlaying(true);
  }, [gameOverProgress]);

  const goHome = useCallback(() => {
    gameOverProgress.stopAnimation();
    gameOverProgress.setValue(0);
    setGameOverResult(null);
    setGameOverTransitioning(false);
    setIsPlaying(false);
    void loadRevives();
  }, [gameOverProgress, loadRevives]);

  const gameOverScale = gameOverProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 1],
  });
  const gameOverRotate = gameOverProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["-720deg", "0deg"],
  });
  const gameOverOpacity = gameOverProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 0.9, 1],
  });

  if (isPlaying) {
    return (
      <View style={styles.playShell}>
        <FuryRing difficulty={difficulty} onGameOver={handleGameOver} />
        <GameBanner />
        {gameOverTransitioning && gameOverResult && (
          <View pointerEvents="none" style={styles.gameOverTransitionLayer}>
            <Animated.View
              style={{
                width: screenWidth,
                height: screenHeight,
                opacity: gameOverOpacity,
                transform: [
                  { scale: gameOverScale },
                  { rotate: gameOverRotate },
                ],
              }}
            >
              <GameOverScreen result={gameOverResult} interactive={false} />
            </Animated.View>
          </View>
        )}
      </View>
    );
  }

  if (gameOverResult) {
    return (
      <GameOverScreen
        result={gameOverResult}
        interactive
        onPlayAgain={startNewGame}
        onHome={goHome}
      />
    );
  }

  if (showInfo) {
    return (
      <ImageBackground source={NIGHT_SKY_SOURCE} resizeMode="cover" style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => setShowInfo(false)}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.infoContent}>
          <FuryArtwork kind="logo" style={styles.infoLogo} />
          <Text style={styles.infoTitle}>{strings.infoTitle}</Text>
          <Text style={styles.infoText}>{strings.infoIntro}</Text>
          <Text style={styles.infoText}>{strings.infoControls}</Text>
          <Text style={styles.infoText}>{strings.infoBonus}</Text>

          <View style={styles.infoLinks}>
            <Pressable
              style={styles.infoLinkButton}
              onPress={() => void Linking.openURL(COMMUNITY_URL)}
            >
              <Text style={styles.infoLinkText}>{strings.communityButton}</Text>
            </Pressable>
            <Pressable
              style={styles.infoLinkButton}
              onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
            >
              <Text style={styles.infoLinkText}>{strings.privacyPolicy}</Text>
            </Pressable>
            <Pressable
              style={styles.infoLinkButton}
              onPress={() => void Linking.openURL(TERMS_OF_USE_URL)}
            >
              <Text style={styles.infoLinkText}>{strings.termsOfUse}</Text>
            </Pressable>
            <Pressable
              style={styles.infoLinkButton}
              onPress={() => void Linking.openURL(CONTACT_URL)}
            >
              <Text style={styles.infoLinkText}>{strings.contact}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>© 2026 Morning Coffee Labs</Text>
      </ImageBackground>
    );
  }

  const reviveFull = revives >= MAX_REVIVES;
  const earnDisabled = reviveFull || earningRevive;

  return (
    <ImageBackground source={NIGHT_SKY_SOURCE} resizeMode="cover" style={styles.container}>
      <Pressable style={styles.infoButton} onPress={() => setShowInfo(true)}>
        <Text style={styles.infoButtonText}>i</Text>
      </Pressable>

      <View style={styles.content}>
        <FuryArtwork kind="logo" style={styles.logo} />

        <View style={styles.revivePanel}>
          <Text style={styles.reviveCount}>{strings.revives} {revives}/{MAX_REVIVES}</Text>
          <Pressable
            disabled={earnDisabled}
            style={[styles.earnReviveButton, earnDisabled && styles.earnReviveButtonDisabled]}
            onPress={earnRevive}
          >
            <Text style={[styles.earnReviveButtonText, earnDisabled && styles.earnReviveButtonTextDisabled]}>
              {reviveFull
                ? strings.reviveFull
                : earningRevive
                  ? strings.loadingAd
                  : strings.earnRevive}
            </Text>
          </Pressable>
          <Text style={styles.reviveHint}>{strings.reviveHint}</Text>
          {!!reviveMessage && <Text style={styles.reviveMessage}>{reviveMessage}</Text>}
        </View>

        <Text style={styles.difficultyLabel}>{strings.difficulty}</Text>

        <View style={styles.difficultyRow}>
          {FURY_DIFFICULTY_ORDER.map((option) => {
            const selected = option === difficulty;
            return (
              <Pressable
                key={option}
                style={[styles.difficultyButton, selected && styles.difficultyButtonSelected]}
                onPress={() => setDifficulty(option)}
              >
                <Text style={[styles.difficultyButtonText, selected && styles.difficultyButtonTextSelected]}>
                  {FURY_DIFFICULTIES[option].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.primaryButton} onPress={startNewGame}>
          <Text style={styles.primaryButtonText}>{strings.startGame}</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>© 2026 Morning Coffee Labs</Text>
    </ImageBackground>
  );
}

function GameOverScreen({
  result,
  interactive,
  onPlayAgain,
  onHome,
}: {
  result: GameOverResult;
  interactive: boolean;
  onPlayAgain?: () => void;
  onHome?: () => void;
}) {
  return (
    <ImageBackground source={NIGHT_SKY_SOURCE} resizeMode="cover" style={styles.gameOverScreen}>
      <View style={styles.gameOverContent}>
        <Text style={styles.gameOverDifficulty}>{FURY_DIFFICULTIES[result.difficulty].label}</Text>

        <View style={styles.gameOverScoreRow}>
          <Text style={styles.gameOverScoreText}>{strings.score}: {result.score}</Text>
          <Text style={styles.gameOverHighScoreText}>{strings.highScore}: {result.highScore}</Text>
        </View>

        <Image source={GAME_OVER_SOURCE} resizeMode="contain" style={styles.gameOverArtwork} />

        {interactive && (
          <>
            <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
              <Text style={styles.playAgainButtonText}>{strings.playAgain}</Text>
            </Pressable>

            <Pressable style={styles.homeButton} onPress={onHome}>
              <Text style={styles.homeButtonText}>{strings.home}</Text>
            </Pressable>
          </>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#02050d" },
  playShell: { flex: 1, width: "100%", height: "100%", backgroundColor: "#02050d", overflow: "hidden" },
  gameOverTransitionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: { width: "100%", alignItems: "center", paddingHorizontal: 24 },
  logo: { width: "72%", maxWidth: 390, aspectRatio: 1.16, marginBottom: 14 },
  revivePanel: { width: "78%", maxWidth: 320, alignItems: "center", marginBottom: 22 },
  reviveCount: { color: "#FFD166", fontSize: 14, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
  earnReviveButton: { width: "100%", minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "#6FE7FF", backgroundColor: "rgba(111,231,255,0.08)", paddingHorizontal: 16 },
  earnReviveButtonDisabled: { borderColor: "rgba(247,250,255,0.2)", backgroundColor: "rgba(247,250,255,0.04)" },
  earnReviveButtonText: { color: "#6FE7FF", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  earnReviveButtonTextDisabled: { color: "rgba(247,250,255,0.4)" },
  reviveHint: { marginTop: 6, color: "rgba(247,250,255,0.45)", fontSize: 10, textAlign: "center" },
  reviveMessage: { marginTop: 5, color: "#FFD166", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  difficultyLabel: { color: "rgba(247,250,255,0.72)", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginBottom: 10 },
  difficultyRow: { width: "100%", maxWidth: 430, flexDirection: "row", gap: 8, marginBottom: 24 },
  difficultyButton: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(111,231,255,0.45)", backgroundColor: "rgba(2,5,13,0.5)", paddingHorizontal: 6 },
  difficultyButtonSelected: { borderColor: "#FFB000", backgroundColor: "rgba(255,176,0,0.13)" },
  difficultyButtonText: { color: "rgba(247,250,255,0.76)", fontSize: 11, fontWeight: "900", letterSpacing: 0.5, textAlign: "center" },
  difficultyButtonTextSelected: { color: "#FFB000" },
  primaryButton: { width: "78%", maxWidth: 320, minHeight: 58, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#FFB000", paddingHorizontal: 24 },
  primaryButtonText: { color: "#08111f", fontSize: 20, fontWeight: "900", letterSpacing: 1.2 },
  infoButton: { position: "absolute", top: 42, right: 22, width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#6FE7FF", alignItems: "center", justifyContent: "center", zIndex: 10 },
  infoButtonText: { color: "#F7FAFF", fontSize: 22, fontWeight: "800", lineHeight: 24 },
  backButton: { position: "absolute", top: 38, left: 20, width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#6FE7FF", alignItems: "center", justifyContent: "center", zIndex: 10 },
  backButtonText: { color: "#F7FAFF", fontSize: 38, fontWeight: "500", lineHeight: 39, marginTop: -3 },
  infoContent: { width: "100%", maxWidth: 520, alignItems: "center", paddingHorizontal: 34 },
  infoLogo: { width: "42%", maxWidth: 190, aspectRatio: 1.16, marginBottom: 12 },
  infoTitle: { color: "#FFB000", fontSize: 30, fontWeight: "900", letterSpacing: 2, marginBottom: 26 },
  infoText: { width: "100%", color: "#F7FAFF", fontSize: 16, lineHeight: 23, textAlign: "center", marginBottom: 13 },
  infoLinks: { width: "100%", marginTop: 24, alignItems: "center" },
  infoLinkButton: { width: "82%", maxWidth: 300, minHeight: 46, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "rgba(111,231,255,0.35)" },
  infoLinkText: { color: "#6FE7FF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  footer: { position: "absolute", bottom: 22, color: "rgba(247,250,255,0.72)", fontSize: 12 },
  gameOverScreen: { flex: 1, width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#02050d" },
  gameOverContent: { width: "100%", maxWidth: 620, alignItems: "center", paddingHorizontal: 24 },
  gameOverDifficulty: { color: "rgba(111,231,255,0.82)", fontSize: 13, fontWeight: "900", letterSpacing: 1.8, marginBottom: 18 },
  gameOverScoreRow: { width: "100%", maxWidth: 520, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  gameOverScoreText: { fontSize: 18, fontWeight: "900", color: "#FFB000", fontVariant: ["tabular-nums"] },
  gameOverHighScoreText: { fontSize: 18, fontWeight: "900", color: "#6FE7FF", fontVariant: ["tabular-nums"] },
  gameOverArtwork: { width: "100%", maxWidth: 560, height: 250, marginBottom: 34 },
  playAgainButton: { width: "82%", maxWidth: 340, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#FFB000", paddingHorizontal: 24 },
  playAgainButtonText: { color: "#08111f", fontSize: 20, fontWeight: "900", letterSpacing: 1.2 },
  homeButton: { marginTop: 18, minWidth: 146, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 2, borderColor: "#6FE7FF", paddingHorizontal: 26 },
  homeButtonText: { color: "#F7FAFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
});