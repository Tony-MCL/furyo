import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  AppState,
  Easing,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import {
  FURY_DIFFICULTIES,
  type FuryDifficulty,
} from "./fury-difficulty";
import { strings } from "./i18n";

const CANVAS_SIZE = 79;
const RING_CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = 24;
const RING_STROKE_WIDTH = 5;
const GAP_SIZE_DEGREES = 75;
const ROTATION_DURATION_MS = 5200;
const DEGREES_PER_MS = 360 / ROTATION_DURATION_MS;
const EDGE_MARGIN = 16;
const REVIVE_INVULNERABILITY_MS = 1000;
const RESUME_COUNTDOWN_SECONDS = 3;
const REVIVE_STORAGE_KEY = "fury-o-revives";
const TEST_START_REVIVES = 3;
const FIRST_REVIVE_BALL_DELAY_MS = 30000;
const REVIVE_BALL_MIN_INTERVAL_MS = 15000;
const REVIVE_BALL_MAX_INTERVAL_MS = 20000;

const RING_COLOR = "#FFB000";
const BALL_COLOR = "#6FE7FF";
const TEXT_COLOR = "#F7FAFF";
const BONUS_COLOR = "#FFD166";
const REVIVE_BALL_COLOR = "#7CFF6B";

const BALL_SIZE = 12;
const BALL_RADIUS = BALL_SIZE / 2;
const BOMB_SIZE = 18;
const SLOW_BALL_CHANCE = 0.1;
const SLOW_BALL_DURATION_MULTIPLIER = 2;
const BOMB_MIN_INTERVAL_MS = 6000;
const BOMB_MAX_INTERVAL_MS = 14000;
const BONUS_BALL_CHANCE = 0.06;
const SPECIAL_BALL_BONUS = 10;
const NORMAL_BONUS_SPEEDUP_CHANCE = 0.25;
const NORMAL_BONUS_SPEEDUP_MULTIPLIER = 0.5;
const FURY_BONUS_SLOW_CHANCE = 0.5;
const EXTREME_FURY_BONUS_SLOW_CHANCE = 0.8;
const BONUS_SLOW_MULTIPLIER = 2;
const TOP_BOTTOM_CENTER_EXCLUSION_RATIO = 0.4;
const EATEN_BALL_BONUS = 5;
const LEGACY_HIGH_SCORE_STORAGE_KEY = "fury-o-high-score";

const COLLISION_HALF_WIDTH = RING_STROKE_WIDTH / 2 + BALL_RADIUS;
const COLLISION_INNER_RADIUS = RING_RADIUS - COLLISION_HALF_WIDTH;
const COLLISION_OUTER_RADIUS = RING_RADIUS + COLLISION_HALF_WIDTH;
const SAFE_GAP_HALF_DEGREES = GAP_SIZE_DEGREES / 2;

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

export type FuryReviveHandle = {
  useRevive: () => boolean;
  useAdRevive: () => boolean;
};

type FuryRingProps = {
  difficulty: FuryDifficulty;
  onGameOver: (result: FuryGameOverResult) => void;
  reviveHandle?: React.MutableRefObject<FuryReviveHandle | null>;
};

type Edge = "top" | "right" | "bottom" | "left";
type ProjectileKind = "ball" | "bomb" | "bonus" | "revive";

type BallData = {
  id: number;
  kind: ProjectileKind;
  slow: boolean;
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
  const outside = BOMB_SIZE * 2;

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

function getBonusDurationMultiplier(difficulty: FuryDifficulty) {
  if (difficulty === "fury") {
    return Math.random() < FURY_BONUS_SLOW_CHANCE ? BONUS_SLOW_MULTIPLIER : 1;
  }
  if (difficulty === "extreme-fury") {
    return Math.random() < EXTREME_FURY_BONUS_SLOW_CHANCE ? BONUS_SLOW_MULTIPLIER : 1;
  }
  return Math.random() < NORMAL_BONUS_SPEEDUP_CHANCE
    ? NORMAL_BONUS_SPEEDUP_MULTIPLIER
    : 1;
}

function createProjectile(
  id: number,
  width: number,
  height: number,
  difficulty: FuryDifficulty,
  kind: ProjectileKind = "ball",
): BallData {
  const config = FURY_DIFFICULTIES[difficulty];
  const startEdge = getRandomEdge();
  const endEdge = getOppositeEdge(startEdge);
  const start = getPointOnEdge(startEdge, width, height, true);
  const end = getPointOnEdge(endEdge, width, height);
  const slow = kind === "ball" && Math.random() < SLOW_BALL_CHANCE;
  const baseDuration = randomBetween(config.ballMinTravelMs, config.ballMaxTravelMs);
  const durationMultiplier =
    kind === "bonus" || kind === "revive"
      ? getBonusDurationMultiplier(difficulty)
      : slow
        ? SLOW_BALL_DURATION_MULTIPLIER
        : 1;

  return {
    id,
    kind,
    slow,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    duration: baseDuration * durationMultiplier,
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
  onEaten: (id: number, kind: ProjectileKind) => void;
  onDone: (id: number, kind: ProjectileKind) => void;
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
        onEaten(ball.id, ball.kind);
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
      if (finished && !resolvedRef.current) onDone(ball.id, ball.kind);
    });

    return () => {
      animation.stop();
    };
  }, [ball.duration, ball.id, ball.kind, onDone, paused, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ball.startX, ball.endX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ball.startY, ball.endY],
  });

  if (ball.kind === "bonus") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.bonusBall, { transform: [{ translateX }, { translateY }] }]}
      >
        <Text style={styles.bonusBallText}>10</Text>
      </Animated.View>
    );
  }

  if (ball.kind === "revive") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.reviveBall, { transform: [{ translateX }, { translateY }] }]}
      >
        <Text style={styles.reviveBallText}>+1</Text>
      </Animated.View>
    );
  }

  if (ball.kind === "bomb") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.bomb, { transform: [{ translateX }, { translateY }] }]}
      >
        <View style={styles.bombFuse} />
        <View style={styles.bombSpark} />
        <View style={styles.bombShine} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ball, { transform: [{ translateX }, { translateY }] }]}
    />
  );
}

function createRingPath() {
  const path = Skia.Path.Make();
  const diameter = RING_RADIUS * 2;
  const rect = {
    x: RING_CENTER - RING_RADIUS,
    y: RING_CENTER - RING_RADIUS,
    width: diameter,
    height: diameter,
  };
  path.addArc(rect, GAP_SIZE_DEGREES / 2, 360 - GAP_SIZE_DEGREES);
  return path;
}

const ringPath = createRingPath();

export default function FuryRing({ difficulty, onGameOver, reviveHandle }: FuryRingProps) {
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
  const windowHeightRef = useRef(windowHeight);
  const nextBallIdRef = useRef(1);
  const gameOverRef = useRef(false);
  const runStartTimeRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const reviveUsedRef = useRef(false);
  const reviveCountRef = useRef(0);
  const reviveBallCollectedRef = useRef(false);
  const activeReviveBallRef = useRef(false);
  const invulnerableUntilRef = useRef(0);
  const pausedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const resumeCountdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeCountdownActiveRef = useRef(false);

  const [balls, setBalls] = useState<BallData[]>([]);
  const [survivalPoints, setSurvivalPoints] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [reviveCount, setReviveCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);

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

  const finishPausedResume = useCallback(() => {
    if (pauseStartedAtRef.current !== null) {
      totalPausedMsRef.current += Date.now() - pauseStartedAtRef.current;
    }
    pauseStartedAtRef.current = null;
    pausedRef.current = false;
    gameOverRef.current = false;
    lastTimestampRef.current = null;
    resumeCountdownTimerRef.current = null;
    resumeCountdownActiveRef.current = false;
    setResumeCountdown(null);
    setIsPaused(false);
  }, []);

  const startReviveCountdown = useCallback(() => {
    if (resumeCountdownTimerRef.current !== null) {
      clearTimeout(resumeCountdownTimerRef.current);
      resumeCountdownTimerRef.current = null;
    }
    resumeCountdownActiveRef.current = true;
    let nextValue = RESUME_COUNTDOWN_SECONDS;
    setResumeCountdown(nextValue);

    const tick = () => {
      nextValue -= 1;
      if (nextValue <= 0) {
        finishPausedResume();
        return;
      }
      setResumeCountdown(nextValue);
      resumeCountdownTimerRef.current = setTimeout(tick, 1000);
    };

    resumeCountdownTimerRef.current = setTimeout(tick, 1000);
  }, [finishPausedResume]);

  useEffect(() => {
    const clearResumeCountdown = () => {
      if (resumeCountdownTimerRef.current !== null) {
        clearTimeout(resumeCountdownTimerRef.current);
        resumeCountdownTimerRef.current = null;
      }
      resumeCountdownActiveRef.current = false;
      setResumeCountdown(null);
    };

    const startResumeCountdown = () => {
      if (!pausedRef.current || resumeCountdownActiveRef.current || gameOverRef.current) return;
      resumeCountdownActiveRef.current = true;
      let nextValue = RESUME_COUNTDOWN_SECONDS;
      setResumeCountdown(nextValue);

      const tick = () => {
        nextValue -= 1;
        if (nextValue <= 0) {
          finishPausedResume();
          return;
        }
        setResumeCountdown(nextValue);
        resumeCountdownTimerRef.current = setTimeout(tick, 1000);
      };

      resumeCountdownTimerRef.current = setTimeout(tick, 1000);
    };

    const setPaused = (shouldPause: boolean) => {
      if (shouldPause) {
        clearResumeCountdown();
        if (!pausedRef.current) {
          pausedRef.current = true;
          pauseStartedAtRef.current = Date.now();
          lastTimestampRef.current = null;
          setIsPaused(true);
        }
        return;
      }

      if (pausedRef.current && !gameOverRef.current) startResumeCountdown();
    };

    setPaused(AppState.currentState !== "active");
    const subscription = AppState.addEventListener("change", (nextState) => {
      setPaused(nextState !== "active");
    });

    return () => {
      clearResumeCountdown();
      subscription.remove();
    };
  }, [finishPausedResume]);

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
          if (Number.isFinite(parsed) && parsed >= 0) nextCount = parsed;
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
        const activeNormalBalls = currentBalls.filter((ball) => ball.kind === "ball").length;
        if (activeNormalBalls >= maxActiveBalls) return currentBalls;
        const kind: ProjectileKind = Math.random() < BONUS_BALL_CHANCE ? "bonus" : "ball";
        const ball = createProjectile(nextBallIdRef.current, windowWidth, windowHeight, difficulty, kind);
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

  useEffect(() => {
    if (windowWidth <= 0 || windowHeight <= 0) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleBomb = () => {
      const delay = randomBetween(BOMB_MIN_INTERVAL_MS, BOMB_MAX_INTERVAL_MS);
      timeoutId = setTimeout(() => {
        if (gameOverRef.current) return;
        if (pausedRef.current) {
          scheduleBomb();
          return;
        }
        setBalls((currentBalls) => {
          const bomb = createProjectile(nextBallIdRef.current, windowWidth, windowHeight, difficulty, "bomb");
          nextBallIdRef.current += 1;
          return [...currentBalls, bomb];
        });
        scheduleBomb();
      }, delay);
    };

    scheduleBomb();
    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [difficulty, windowHeight, windowWidth]);

  useEffect(() => {
    if (windowWidth <= 0 || windowHeight <= 0) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let firstAttempt = true;

    const scheduleNextReviveBall = (delay: number) => {
      timeoutId = setTimeout(() => {
        if (gameOverRef.current || reviveBallCollectedRef.current) return;
        if (pausedRef.current || activeReviveBallRef.current) {
          scheduleNextReviveBall(500);
          return;
        }

        activeReviveBallRef.current = true;
        setBalls((currentBalls) => {
          const reviveBall = createProjectile(nextBallIdRef.current, windowWidth, windowHeight, difficulty, "revive");
          nextBallIdRef.current += 1;
          return [...currentBalls, reviveBall];
        });
      }, delay);
    };

    scheduleNextReviveBall(FIRST_REVIVE_BALL_DELAY_MS);

    const interval = setInterval(() => {
      if (
        firstAttempt ||
        gameOverRef.current ||
        pausedRef.current ||
        reviveBallCollectedRef.current ||
        activeReviveBallRef.current
      ) return;
      firstAttempt = false;
    }, 1000);

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [difficulty, windowHeight, windowWidth]);

  const scheduleReviveBallAfterMissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removeBall = useCallback((id: number) => {
    setBalls((currentBalls) => currentBalls.filter((ball) => ball.id !== id));
  }, []);

  const handleBallDone = useCallback((id: number, kind: ProjectileKind) => {
    removeBall(id);
    if (kind !== "revive" || gameOverRef.current || reviveBallCollectedRef.current) return;
    activeReviveBallRef.current = false;
    if (scheduleReviveBallAfterMissRef.current !== null) {
      clearTimeout(scheduleReviveBallAfterMissRef.current);
    }
    scheduleReviveBallAfterMissRef.current = setTimeout(() => {
      if (gameOverRef.current || pausedRef.current || reviveBallCollectedRef.current || activeReviveBallRef.current) return;
      activeReviveBallRef.current = true;
      setBalls((currentBalls) => {
        const reviveBall = createProjectile(nextBallIdRef.current, windowWidth, windowHeight, difficulty, "revive");
        nextBallIdRef.current += 1;
        return [...currentBalls, reviveBall];
      });
    }, randomBetween(REVIVE_BALL_MIN_INTERVAL_MS, REVIVE_BALL_MAX_INTERVAL_MS));
  }, [difficulty, removeBall, windowHeight, windowWidth]);

  useEffect(() => {
    return () => {
      if (scheduleReviveBallAfterMissRef.current !== null) {
        clearTimeout(scheduleReviveBallAfterMissRef.current);
      }
    };
  }, []);

  const bonusFeedbackPointsRef = useRef(EATEN_BALL_BONUS);

  const showBonusFeedback = useCallback((points = EATEN_BALL_BONUS) => {
    bonusFeedbackPointsRef.current = points;
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

  const finishGame = useCallback(() => {
    const currentScore = scoreRef.current;
    const previousHighScore = sessionHighScores[difficulty];
    const nextHighScore = Math.max(previousHighScore, currentScore);
    sessionHighScores[difficulty] = nextHighScore;
    if (nextHighScore > previousHighScore) {
      void AsyncStorage.setItem(getHighScoreStorageKey(difficulty), String(nextHighScore)).catch(() => {});
    }
    gameOverRef.current = true;
    pausedRef.current = true;
    if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
    setIsPaused(true);
    onGameOver({ difficulty, score: currentScore, highScore: nextHighScore });
  }, [difficulty, onGameOver]);

  const activateRevive = useCallback(() => {
    if (!gameOverRef.current || reviveUsedRef.current) return false;

    reviveUsedRef.current = true;
    setReviveUsed(true);
    invulnerableUntilRef.current = Date.now() + REVIVE_INVULNERABILITY_MS;
    showReviveFeedback();
    startReviveCountdown();
    return true;
  }, [showReviveFeedback, startReviveCountdown]);

  const useStoredRevive = useCallback(() => {
    if (reviveCountRef.current <= 0) return false;

    const nextReviveCount = reviveCountRef.current - 1;
    reviveCountRef.current = nextReviveCount;
    setReviveCount(nextReviveCount);
    void AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(nextReviveCount)).catch(() => {});

    const activated = activateRevive();
    if (!activated) {
      reviveCountRef.current += 1;
      setReviveCount(reviveCountRef.current);
      void AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(reviveCountRef.current)).catch(() => {});
    }
    return activated;
  }, [activateRevive]);

  const useAdRevive = useCallback(() => {
    return activateRevive();
  }, [activateRevive]);

  useEffect(() => {
    if (!reviveHandle) return;
    reviveHandle.current = { useRevive: useStoredRevive, useAdRevive };
    return () => {
      reviveHandle.current = null;
    };
  }, [reviveHandle, useAdRevive, useStoredRevive]);

  const handleCollision = useCallback((id: number) => {
    if (gameOverRef.current || pausedRef.current) return;

    if (Date.now() < invulnerableUntilRef.current) {
      removeBall(id);
      return;
    }

    if (reviveUsedRef.current) {
      finishGame();
      return;
    }

    removeBall(id);
    finishGame();
  }, [finishGame, removeBall]);

  const handleEaten = useCallback((id: number, kind: ProjectileKind) => {
    if (gameOverRef.current || pausedRef.current) return;
    if (kind === "bomb") {
      handleCollision(id);
      return;
    }
    removeBall(id);

    if (kind === "revive") {
      if (reviveBallCollectedRef.current) return;
      reviveBallCollectedRef.current = true;
      activeReviveBallRef.current = false;
      if (scheduleReviveBallAfterMissRef.current !== null) {
        clearTimeout(scheduleReviveBallAfterMissRef.current);
        scheduleReviveBallAfterMissRef.current = null;
      }
      const nextReviveCount = reviveCountRef.current + 1;
      reviveCountRef.current = nextReviveCount;
      setReviveCount(nextReviveCount);
      void AsyncStorage.setItem(REVIVE_STORAGE_KEY, String(nextReviveCount)).catch(() => {});
      showBonusFeedback(1);
      return;
    }

    const points = kind === "bonus" ? SPECIAL_BALL_BONUS : EATEN_BALL_BONUS;
    setBonusPoints((current) => current + points);
    showBonusFeedback(points);
  }, [handleCollision, removeBall, showBonusFeedback]);

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
    Math.max(0, windowHeightRef.current / 2 - RING_RADIUS - RING_STROKE_WIDTH / 2 - EDGE_MARGIN);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !gameOverRef.current && !pausedRef.current,
      onStartShouldSetPanResponderCapture: () => !gameOverRef.current && !pausedRef.current,
      onMoveShouldSetPanResponder: () => !gameOverRef.current && !pausedRef.current,
      onMoveShouldSetPanResponderCapture: () => !gameOverRef.current && !pausedRef.current,
      onPanResponderGrant: () => {
        dragStartYRef.current = ringYRef.current;
      },
      onPanResponderMove: (_event, gestureState) => {
        if (gameOverRef.current || pausedRef.current) return;
        const verticalLimit = getVerticalLimit();
        const nextY = clamp(dragStartYRef.current + gestureState.dy, -verticalLimit, verticalLimit);
        ringYRef.current = nextY;
        translateY.setValue(nextY);
      },
      onPanResponderRelease: () => {
        if (!gameOverRef.current && !pausedRef.current) reverseDirection();
      },
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const rotate = rotation.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] });
  const bonusScale = bonusFeedback.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <ImageBackground
      source={require("../public/nightsky.png")}
      resizeMode="cover"
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <Text pointerEvents="none" style={styles.scoreText}>{strings.score}: {score}</Text>
      <Text pointerEvents="none" style={styles.difficultyText}>{difficultyConfig.label}</Text>
      <Text pointerEvents="none" style={styles.reviveStatusText}>
        {strings.revives} {reviveCount}{reviveUsed ? ` · ${strings.usedThisRound}` : reviveCount > 0 ? ` · ${strings.ready}` : ` · ${strings.empty}`}
      </Text>

      {balls.map((ball) => (
        <SpawnBall
          key={ball.id}
          ball={ball}
          paused={isPaused}
          getRingState={getRingState}
          onCollision={handleCollision}
          onEaten={handleEaten}
          onDone={handleBallDone}
        />
      ))}

      <Animated.View pointerEvents="none" style={[styles.movementLayer, { transform: [{ translateY }] }]}>
        <Animated.View style={[styles.ringSurface, { transform: [{ rotate }] }]}>
          <Canvas style={styles.canvas}>
            <Path
              path={ringPath}
              color={RING_COLOR}
              style="stroke"
              strokeWidth={RING_STROKE_WIDTH}
              strokeCap="round"
            />
          </Canvas>
        </Animated.View>

        <Animated.Text style={[styles.bonusText, { opacity: bonusFeedback, transform: [{ scale: bonusScale }] }]}>
          +{bonusFeedbackPointsRef.current}
        </Animated.Text>
        <Animated.View style={[styles.reviveGlow, { opacity: reviveFeedback }]} />
        <Animated.Text style={[styles.reviveText, { opacity: reviveFeedback }]}>{strings.revive}</Animated.Text>
      </Animated.View>

      {resumeCountdown !== null && (
        <View pointerEvents="none" style={styles.resumeCountdownOverlay}>
          <Text style={styles.resumeCountdownText}>{resumeCountdown}</Text>
        </View>
      )}
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
  bonusBall: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD166",
    borderWidth: 2,
    borderColor: "#FFF4C2",
  },
  bonusBallText: {
    color: "#3A2500",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
  },
  reviveBall: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: REVIVE_BALL_COLOR,
    borderWidth: 2,
    borderColor: "#E6FFE1",
  },
  reviveBallText: {
    color: "#08210B",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
  },
  bomb: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: BOMB_SIZE,
    height: BOMB_SIZE,
    marginLeft: -BOMB_SIZE / 2,
    marginTop: -BOMB_SIZE / 2,
    borderRadius: BOMB_SIZE / 2,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#FF8A00",
  },
  bombFuse: {
    position: "absolute",
    width: 3,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#FFD166",
    right: -2,
    top: -7,
    transform: [{ rotate: "35deg" }],
  },
  bombSpark: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFB000",
    right: -6,
    top: -10,
  },
  bombShine: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(247,250,255,0.72)",
    left: 3,
    top: 3,
  },
  movementLayer: { width: CANVAS_SIZE, height: CANVAS_SIZE },
  ringSurface: { width: CANVAS_SIZE, height: CANVAS_SIZE },
  canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE },
  bonusText: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: CANVAS_SIZE,
    fontSize: 14,
    fontWeight: "900",
    color: BONUS_COLOR,
  },
  reviveGlow: {
    position: "absolute",
    left: -8,
    top: -8,
    width: CANVAS_SIZE + 16,
    height: CANVAS_SIZE + 16,
    borderRadius: (CANVAS_SIZE + 16) / 2,
    borderWidth: 3,
    borderColor: BONUS_COLOR,
  },
  reviveText: {
    position: "absolute",
    top: CANVAS_SIZE + 8,
    left: -40,
    width: CANVAS_SIZE + 80,
    textAlign: "center",
    color: BONUS_COLOR,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  resumeCountdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,5,13,0.32)",
  },
  resumeCountdownText: {
    color: "#FFB000",
    fontSize: 96,
    lineHeight: 108,
    fontWeight: "900",
    textAlign: "center",
  },
});