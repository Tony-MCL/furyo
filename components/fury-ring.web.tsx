import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import {
  FURY_DIFFICULTIES,
  type FuryDifficulty,
} from "./fury-difficulty";
import { strings } from "./i18n";

const SIZE = 79;
const CENTER = SIZE / 2;
const RADIUS = 24;
const STROKE_WIDTH = 5;
const GAP_DEGREES = 75;
const ROTATION_DURATION_MS = 5200;
const DEGREES_PER_MS = 360 / ROTATION_DURATION_MS;
const TAP_MOVEMENT_THRESHOLD = 8;
const EDGE_MARGIN = 16;
const REVIVE_INVULNERABILITY_MS = 1000;
const MAX_REVIVES = 3;
const REVIVE_STORAGE_KEY = "fury-o-revives";
const TEST_START_REVIVES = 3;

const RING_COLOR = "#FFB000";
const BALL_COLOR = "#6FE7FF";
const TEXT_COLOR = "#F7FAFF";
const BONUS_COLOR = "#FFD166";

const BALL_SIZE = 12;
const BALL_RADIUS = BALL_SIZE / 2;
const TOP_BOTTOM_CENTER_EXCLUSION_RATIO = 0.4;
const EATEN_BALL_BONUS = 5;
const LEGACY_HIGH_SCORE_STORAGE_KEY = "fury-o-high-score";

const COLLISION_HALF_WIDTH = STROKE_WIDTH / 2 + BALL_RADIUS;
const COLLISION_INNER_RADIUS = RADIUS - COLLISION_HALF_WIDTH;
const COLLISION_OUTER_RADIUS = RADIUS + COLLISION_HALF_WIDTH;
const SAFE_GAP_HALF_DEGREES = GAP_DEGREES / 2;

const sessionHighScores: Record<FuryDifficulty, number> = {
  normal: 0,
  fury: 0,
  "extreme-fury": 0,
};

export type FuryGameOverResult = {
  difficulty: FuryDifficulty;
  score: number;
  highScore: number;
};

type FuryRingProps = {
  difficulty: FuryDifficulty;
  onGameOver: (result: FuryGameOverResult) => void;
};

type Edge = "top" | "right" | "bottom" | "left";

type BallData = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
};

type RingState = {
  y: number;
  angle: number;
  gameOver: boolean;
  paused: boolean;
};

const circumference = 2 * Math.PI * RADIUS;
const visibleFraction = (360 - GAP_DEGREES) / 360;
const visibleLength = circumference * visibleFraction;
const gapLength = circumference - visibleLength;
const dashOffset = -gapLength / 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function shortestAngleDifference(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

function getHighScoreStorageKey(difficulty: FuryDifficulty) {
  return `fury-o-high-score-${difficulty}`;
}

function getMaxActiveBalls(elapsedMs: number, difficulty: FuryDifficulty) {
  const config = FURY_DIFFICULTIES[difficulty];
  const addedBalls = Math.floor(elapsedMs / config.ballCountStepMs);
  return Math.min(config.startMaxBalls + addedBalls, config.finalMaxBalls);
}

function getSpawnInterval(elapsedMs: number, difficulty: FuryDifficulty) {
  const config = FURY_DIFFICULTIES[difficulty];
  const maxActiveBalls = getMaxActiveBalls(elapsedMs, difficulty);

  if (maxActiveBalls <= config.midMaxBalls) {
    const progress =
      (maxActiveBalls - config.startMaxBalls) /
      (config.midMaxBalls - config.startMaxBalls);

    return Math.round(
      config.spawnIntervalStartMs +
        (config.spawnIntervalMidMs - config.spawnIntervalStartMs) * progress,
    );
  }

  const progress =
    (maxActiveBalls - config.midMaxBalls) /
    (config.finalMaxBalls - config.midMaxBalls);

  return Math.round(
    config.spawnIntervalMidMs +
      (config.spawnIntervalFinalMs - config.spawnIntervalMidMs) * progress,
  );
}

function getOppositeEdge(edge: Edge): Edge {
  switch (edge) {
    case "top": return "bottom";
    case "right": return "left";
    case "bottom": return "top";
    case "left": return "right";
  }
}

function getRandomEdge(): Edge {
  const edges: Edge[] = ["top", "right", "bottom", "left"];
  return edges[Math.floor(Math.random() * edges.length)];
}

function getRandomVerticalSpawnX(width: number) {
  const halfWidth = width / 2;
  const excludedHalfWidth =
    (width * TOP_BOTTOM_CENTER_EXCLUSION_RATIO) / 2;
  const spawnOnLeft = Math.random() < 0.5;

  return spawnOnLeft
    ? randomBetween(-halfWidth, -excludedHalfWidth)
    : randomBetween(excludedHalfWidth, halfWidth);
}

function getPointOnEdge(
  edge: Edge,
  width: number,
  height: number,
  isSpawnPoint = false,
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const outside = BALL_SIZE * 2;

  switch (edge) {
    case "top":
      return {
        x: isSpawnPoint
          ? getRandomVerticalSpawnX(width)
          : randomBetween(-halfWidth, halfWidth),
        y: -halfHeight - outside,
      };
    case "right":
      return {
        x: halfWidth + outside,
        y: randomBetween(-halfHeight, halfHeight),
      };
    case "bottom":
      return {
        x: isSpawnPoint
          ? getRandomVerticalSpawnX(width)
          : randomBetween(-halfWidth, halfWidth),
        y: halfHeight + outside,
      };
    case "left":
      return {
        x: -halfWidth - outside,
        y: randomBetween(-halfHeight, halfHeight),
      };
  }
}

function createBall(
  id: number,
  width: number,
  height: number,
  difficulty: FuryDifficulty,
): BallData {
  const config = FURY_DIFFICULTIES[difficulty];
  const startEdge = getRandomEdge();
  const endEdge = getOppositeEdge(startEdge);
  const start = getPointOnEdge(startEdge, width, height, true);
  const end = getPointOnEdge(endEdge, width, height);

  return {
    id,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    duration: randomBetween(config.ballMinTravelMs, config.ballMaxTravelMs),
  };
}

function getBallDistanceFromRingCenter(
  ballX: number,
  ballY: number,
  ring: RingState,
) {
  return Math.hypot(ballX, ballY - ring.y);
}

function ballHitsRing(ballX: number, ballY: number, ring: RingState) {
  const relativeX = ballX;
  const relativeY = ballY - ring.y;
  const distance = Math.hypot(relativeX, relativeY);

  if (
    distance < COLLISION_INNER_RADIUS ||
    distance > COLLISION_OUTER_RADIUS
  ) {
    return false;
  }

  const ballAngle = normalizeAngle(
    (Math.atan2(relativeY, relativeX) * 180) / Math.PI,
  );
  const gapCenterAngle = normalizeAngle(ring.angle);
  const angleFromGapCenter = Math.abs(
    shortestAngleDifference(ballAngle, gapCenterAngle),
  );

  return angleFromGapCenter > SAFE_GAP_HALF_DEGREES;
}

type SpawnBallProps = {
  ball: BallData;
  paused: boolean;
  getRingState: () => RingState;
  onCollision: (id: number) => void;
  onEaten: (id: number) => void;
  onDone: (id: number) => void;
};

function SpawnBall({
  ball,
  paused,
  getRingState,
  onCollision,
  onEaten,
  onDone,
}: SpawnBallProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);
  const progressValueRef = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      progressValueRef.current = value;
      if (resolvedRef.current) return;
      const ring = getRingState();
      if (ring.gameOver || ring.paused) return;

      const x = ball.startX + (ball.endX - ball.startX) * value;
      const y = ball.startY + (ball.endY - ball.startY) * value;

      if (getBallDistanceFromRingCenter(x, y, ring) < COLLISION_INNER_RADIUS) {
        resolvedRef.current = true;
        onEaten(ball.id);
        return;
      }

      if (ballHitsRing(x, y, ring)) {
        resolvedRef.current = true;
        onCollision(ball.id);
      }
    });

    return () => {
      progress.removeListener(listenerId);
    };
  }, [ball, getRingState, onCollision, onEaten, progress]);

  useEffect(() => {
    animationRef.current?.stop();
    animationRef.current = null;

    if (paused || resolvedRef.current) return;

    const remaining = Math.max(0, 1 - progressValueRef.current);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(1, ball.duration * remaining),
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animationRef.current = animation;

    animation.start(({ finished }) => {
      if (finished && !resolvedRef.current) onDone(ball.id);
    });

    return () => {
      animation.stop();
    };
  }, [ball.duration, ball.id, onDone, paused, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ball.startX, ball.endX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ball.startY, ball.endY],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ball, { transform: [{ translateX }, { translateY }] }]}
    />
  );
}

export default function FuryRing({ difficulty, onGameOver }: FuryRingProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const difficultyConfig = FURY_DIFFICULTIES[difficulty];

  const rotation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bonusFeedback = useRef(new Animated.Value(0)).current;
  const reviveFeedback = useRef(new Animated.Value(0)).current;

  const angleRef = useRef(0);
  const directionRef = useRef(1);
  const lastTimestampRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const ringYRef = useRef(0);
  const dragStartYRef = useRef(0);
  const maxDragDistanceRef = useRef(0);
  const windowHeightRef = useRef(windowHeight);
  const nextBallIdRef = useRef(1);
  const gameOverRef = useRef(false);
  const runStartTimeRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const reviveUsedRef = useRef(false);
  const reviveCountRef = useRef(0);
  const invulnerableUntilRef = useRef(0);
  const pausedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);

  const [balls, setBalls] = useState<BallData[]>([]);
  const [survivalPoints, setSurvivalPoints] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [reviveCount, setReviveCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  windowHeightRef.current = windowHeight;
  const score = survivalPoints + bonusPoints;
  scoreRef.current = score;

  const getActiveElapsedMs = useCallback(() => {
    const currentPauseMs =
      pausedRef.current && pauseStartedAtRef.current !== null
        ? Date.now() - pauseStartedAtRef.current
        : 0;
    return Math.max(
      0,
      Date.now() - runStartTimeRef.current - totalPausedMsRef.current - currentPauseMs,
    );
  }, []);

  useEffect(() => {
    const setPaused = (shouldPause: boolean) => {
      if (shouldPause === pausedRef.current) return;

      if (shouldPause) {
        pausedRef.current = true;
        pauseStartedAtRef.current = Date.now();
        lastTimestampRef.current = null;
        setIsPaused(true);
        return;
      }

      if (pauseStartedAtRef.current !== null) {
        totalPausedMsRef.current += Date.now() - pauseStartedAtRef.current;
      }
      pauseStartedAtRef.current = null;
      pausedRef.current = false;
      lastTimestampRef.current = null;
      setIsPaused(false);
    };

    const updateFromVisibility = () => {
      setPaused(document.hidden || !document.hasFocus());
    };

    const handleBlur = () => setPaused(true);
    const handleFocus = () => updateFromVisibility();

    updateFromVisibility();
    document.addEventListener("visibilitychange", updateFromVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", updateFromVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadHighScore = async () => {
      try {
        const storageKey = getHighScoreStorageKey(difficulty);
        let storedValue = await AsyncStorage.getItem(storageKey);
        if (storedValue === null && difficulty === "normal") {
          storedValue = await AsyncStorage.getItem(LEGACY_HIGH_SCORE_STORAGE_KEY);
          if (storedValue !== null) await AsyncStorage.setItem(storageKey, storedValue);
        }
        if (storedValue === null || cancelled) return;
        const storedHighScore = Number.parseInt(storedValue, 10);
        if (!Number.isFinite(storedHighScore) || storedHighScore < 0) return;
        sessionHighScores[difficulty] = Math.max(sessionHighScores[difficulty], storedHighScore);
      } catch {}
    };
    loadHighScore();
    return () => { cancelled = true; };
  }, [difficulty]);

  useEffect(() => {
    let cancelled = false;
    const loadRevives = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(REVIVE_STORAGE_KEY);
        let nextCount = TEST_START_REVIVES;
        if (storedValue !== null) {
          const parsed = Number.parseInt(storedValue, 10);
          if (Number.isFinite(parsed)) nextCount = clamp(parsed, 0, MAX_REVIVES);
        } else {
          await AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(nextCount));
        }
        if (!cancelled) {
          reviveCountRef.current = nextCount;
          setReviveCount(nextCount);
        }
      } catch {}
    };
    loadRevives();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOverRef.current && !pausedRef.current) {
        setSurvivalPoints(Math.floor(getActiveElapsedMs() / 1000));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [getActiveElapsedMs]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (pausedRef.current) {
        lastTimestampRef.current = null;
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (lastTimestampRef.current !== null) {
        const deltaMs = timestamp - lastTimestampRef.current;
        angleRef.current =
          (angleRef.current + directionRef.current * DEGREES_PER_MS * deltaMs + 360) % 360;
        rotation.setValue(angleRef.current);
      }
      lastTimestampRef.current = timestamp;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [rotation]);

  useEffect(() => {
    if (windowWidth <= 0 || windowHeight <= 0) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const spawnAndSchedule = () => {
      if (pausedRef.current) {
        timeoutId = setTimeout(spawnAndSchedule, 100);
        return;
      }

      const elapsedMs = getActiveElapsedMs();
      const maxActiveBalls = getMaxActiveBalls(elapsedMs, difficulty);
      const spawnInterval = getSpawnInterval(elapsedMs, difficulty);
      setBalls((currentBalls) => {
        if (currentBalls.length >= maxActiveBalls) return currentBalls;
        const ball = createBall(nextBallIdRef.current, windowWidth, windowHeight, difficulty);
        nextBallIdRef.current += 1;
        return [...currentBalls, ball];
      });
      timeoutId = setTimeout(spawnAndSchedule, spawnInterval);
    };
    spawnAndSchedule();
    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [difficulty, getActiveElapsedMs, windowHeight, windowWidth]);

  const removeBall = useCallback((id: number) => {
    setBalls((currentBalls) => currentBalls.filter((ball) => ball.id !== id));
  }, []);

  const showBonusFeedback = useCallback(() => {
    bonusFeedback.stopAnimation();
    bonusFeedback.setValue(0);
    Animated.sequence([
      Animated.timing(bonusFeedback, { toValue: 1, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(220),
      Animated.timing(bonusFeedback, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [bonusFeedback]);

  const showReviveFeedback = useCallback(() => {
    reviveFeedback.stopAnimation();
    reviveFeedback.setValue(0);
    Animated.sequence([
      Animated.timing(reviveFeedback, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.delay(700),
      Animated.timing(reviveFeedback, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [reviveFeedback]);

  const handleEaten = useCallback((id: number) => {
    if (gameOverRef.current || pausedRef.current) return;
    removeBall(id);
    setBonusPoints((current) => current + EATEN_BALL_BONUS);
    showBonusFeedback();
  }, [removeBall, showBonusFeedback]);

  const handleCollision = useCallback((id: number) => {
    if (gameOverRef.current || pausedRef.current) return;

    if (Date.now() < invulnerableUntilRef.current) {
      removeBall(id);
      return;
    }

    if (!reviveUsedRef.current && reviveCountRef.current > 0) {
      const nextReviveCount = reviveCountRef.current - 1;
      reviveCountRef.current = nextReviveCount;
      setReviveCount(nextReviveCount);
      void AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(nextReviveCount)).catch(() => {});
      reviveUsedRef.current = true;
      setReviveUsed(true);
      invulnerableUntilRef.current = Date.now() + REVIVE_INVULNERABILITY_MS;
      removeBall(id);
      showReviveFeedback();
      return;
    }

    const currentScore = scoreRef.current;
    const previousHighScore = sessionHighScores[difficulty];
    const nextHighScore = Math.max(previousHighScore, currentScore);
    sessionHighScores[difficulty] = nextHighScore;
    if (nextHighScore > previousHighScore) {
      void AsyncStorage.setItem(getHighScoreStorageKey(difficulty), String(nextHighScore)).catch(() => {});
    }
    gameOverRef.current = true;
    onGameOver({ difficulty, score: currentScore, highScore: nextHighScore });
  }, [difficulty, onGameOver, removeBall, showReviveFeedback]);

  const getRingState = useCallback(
    (): RingState => ({
      y: ringYRef.current,
      angle: angleRef.current,
      gameOver: gameOverRef.current,
      paused: pausedRef.current,
    }),
    [],
  );

  const reverseDirection = () => {
    if (!gameOverRef.current && !pausedRef.current) directionRef.current *= -1;
  };

  const getVerticalLimit = () =>
    Math.max(0, windowHeightRef.current / 2 - RADIUS - STROKE_WIDTH / 2 - EDGE_MARGIN);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !gameOverRef.current && !pausedRef.current,
      onStartShouldSetPanResponderCapture: () => !gameOverRef.current && !pausedRef.current,
      onMoveShouldSetPanResponder: () => !gameOverRef.current && !pausedRef.current,
      onMoveShouldSetPanResponderCapture: () => !gameOverRef.current && !pausedRef.current,
      onPanResponderGrant: () => {
        dragStartYRef.current = ringYRef.current;
        maxDragDistanceRef.current = 0;
      },
      onPanResponderMove: (_event, gestureState) => {
        if (gameOverRef.current || pausedRef.current) return;
        const dragDistance = Math.hypot(gestureState.dx, gestureState.dy);
        maxDragDistanceRef.current = Math.max(maxDragDistanceRef.current, dragDistance);
        const verticalLimit = getVerticalLimit();
        const nextY = clamp(dragStartYRef.current + gestureState.dy, -verticalLimit, verticalLimit);
        ringYRef.current = nextY;
        translateY.setValue(nextY);
      },
      onPanResponderRelease: () => {
        if (
          !gameOverRef.current &&
          !pausedRef.current &&
          maxDragDistanceRef.current < TAP_MOVEMENT_THRESHOLD
        ) {
          reverseDirection();
        }
      },
      onPanResponderTerminate: () => {
        maxDragDistanceRef.current = 0;
      },
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const rotate = rotation.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] });
  const bonusScale = bonusFeedback.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <ImageBackground
      source={{ uri: "/nightsky.png" }}
      resizeMode="cover"
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <Text pointerEvents="none" style={styles.scoreText}>{strings.score}: {score}</Text>
      <Text pointerEvents="none" style={styles.difficultyText}>{difficultyConfig.label}</Text>
      <Text pointerEvents="none" style={styles.reviveStatusText}>
        {strings.revives} {reviveCount}/{MAX_REVIVES}{reviveUsed ? ` · ${strings.usedThisRound}` : reviveCount > 0 ? ` · ${strings.ready}` : ` · ${strings.empty}`}
      </Text>

      {balls.map((ball) => (
        <SpawnBall
          key={ball.id}
          ball={ball}
          paused={isPaused}
          getRingState={getRingState}
          onCollision={handleCollision}
          onEaten={handleEaten}
          onDone={removeBall}
        />
      ))}

      <Animated.View pointerEvents="none" style={[styles.movementLayer, { transform: [{ translateY }] }]}>
        <Animated.View style={[styles.ringSurface, { transform: [{ rotate }] }]}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={RING_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${visibleLength} ${gapLength}`}
              strokeDashoffset={dashOffset}
            />
          </Svg>
        </Animated.View>

        <Animated.Text style={[styles.bonusText, { opacity: bonusFeedback, transform: [{ scale: bonusScale }] }]}>
          +{EATEN_BALL_BONUS}
        </Animated.Text>
        <Animated.View style={[styles.reviveGlow, { opacity: reviveFeedback }]} />
        <Animated.Text style={[styles.reviveText, { opacity: reviveFeedback }]}>{strings.revive}</Animated.Text>
      </Animated.View>
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
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
    overflow: "hidden",
  },
  scoreText: {
    position: "absolute",
    top: 24,
    left: 24,
    zIndex: 5,
    fontSize: 28,
    fontWeight: "800",
    color: TEXT_COLOR,
    fontVariant: ["tabular-nums"],
  },
  difficultyText: {
    position: "absolute",
    top: 58,
    left: 25,
    zIndex: 5,
    color: "rgba(111,231,255,0.76)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  reviveStatusText: {
    position: "absolute",
    top: 76,
    left: 25,
    zIndex: 5,
    color: "rgba(255,209,102,0.86)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  ball: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: BALL_SIZE,
    height: BALL_SIZE,
    marginLeft: -BALL_SIZE / 2,
    marginTop: -BALL_SIZE / 2,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: BALL_COLOR,
  },
  movementLayer: { width: SIZE, height: SIZE },
  ringSurface: { width: SIZE, height: SIZE },
  bonusText: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: SIZE,
    fontSize: 14,
    fontWeight: "900",
    color: BONUS_COLOR,
  },
  reviveGlow: {
    position: "absolute",
    left: -8,
    top: -8,
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    borderWidth: 3,
    borderColor: BONUS_COLOR,
  },
  reviveText: {
    position: "absolute",
    top: SIZE + 8,
    left: -40,
    width: SIZE + 80,
    textAlign: "center",
    color: BONUS_COLOR,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
});
