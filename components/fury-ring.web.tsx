import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const SIZE = 79;
const CENTER = SIZE / 2;
const RADIUS = 24;
const STROKE_WIDTH = 5;

const GAP_DEGREES = 75;
const ROTATION_DURATION_MS = 5200;
const DEGREES_PER_MS = 360 / ROTATION_DURATION_MS;
const TAP_MOVEMENT_THRESHOLD = 8;
const EDGE_MARGIN = 16;

const RING_COLOR = "#FFB000";
const BALL_COLOR = "#6FE7FF";
const TEXT_COLOR = "#F7FAFF";
const BONUS_COLOR = "#FFD166";

const BALL_SIZE = 12;
const BALL_RADIUS = BALL_SIZE / 2;
const BALL_SPAWN_INTERVAL_START_MS = 1100;
const BALL_SPAWN_INTERVAL_AT_12_MS = 350;
const BALL_SPAWN_INTERVAL_FINAL_MS = 200;
const BALL_MIN_TRAVEL_MS = 3600;
const BALL_MAX_TRAVEL_MS = 5000;
const START_MAX_BALLS = 5;
const MID_MAX_BALLS = 12;
const FINAL_MAX_BALLS = 20;
const BALL_COUNT_STEP_MS = 8000;
const TOP_BOTTOM_CENTER_EXCLUSION_RATIO = 0.25;
const EATEN_BALL_BONUS = 5;

const COLLISION_HALF_WIDTH = STROKE_WIDTH / 2 + BALL_RADIUS;
const COLLISION_INNER_RADIUS = RADIUS - COLLISION_HALF_WIDTH;
const COLLISION_OUTER_RADIUS = RADIUS + COLLISION_HALF_WIDTH;
const BALL_ANGULAR_CLEARANCE_DEGREES =
  (Math.asin(Math.min(1, BALL_RADIUS / RADIUS)) * 180) / Math.PI;
const SAFE_GAP_HALF_DEGREES =
  GAP_DEGREES / 2 - BALL_ANGULAR_CLEARANCE_DEGREES;

let sessionHighScore = 0;

type FuryRingProps = {
  onHome?: () => void;
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

function getMaxActiveBalls(elapsedMs: number) {
  const addedBalls = Math.floor(elapsedMs / BALL_COUNT_STEP_MS);
  return Math.min(START_MAX_BALLS + addedBalls, FINAL_MAX_BALLS);
}

function getSpawnInterval(elapsedMs: number) {
  const maxActiveBalls = getMaxActiveBalls(elapsedMs);

  if (maxActiveBalls <= MID_MAX_BALLS) {
    const progress =
      (maxActiveBalls - START_MAX_BALLS) /
      (MID_MAX_BALLS - START_MAX_BALLS);

    return Math.round(
      BALL_SPAWN_INTERVAL_START_MS +
        (BALL_SPAWN_INTERVAL_AT_12_MS - BALL_SPAWN_INTERVAL_START_MS) *
          progress,
    );
  }

  const progress =
    (maxActiveBalls - MID_MAX_BALLS) /
    (FINAL_MAX_BALLS - MID_MAX_BALLS);

  return Math.round(
    BALL_SPAWN_INTERVAL_AT_12_MS +
      (BALL_SPAWN_INTERVAL_FINAL_MS - BALL_SPAWN_INTERVAL_AT_12_MS) *
        progress,
  );
}

function getOppositeEdge(edge: Edge): Edge {
  switch (edge) {
    case "top":
      return "bottom";
    case "right":
      return "left";
    case "bottom":
      return "top";
    case "left":
      return "right";
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

function createBall(id: number, width: number, height: number): BallData {
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
    duration: randomBetween(BALL_MIN_TRAVEL_MS, BALL_MAX_TRAVEL_MS),
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
  getRingState: () => RingState;
  onCollision: () => void;
  onEaten: (id: number) => void;
  onDone: (id: number) => void;
};

function SpawnBall({
  ball,
  getRingState,
  onCollision,
  onEaten,
  onDone,
}: SpawnBallProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const resolvedRef = useRef(false);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      if (resolvedRef.current) {
        return;
      }

      const ring = getRingState();
      if (ring.gameOver) {
        return;
      }

      const x = ball.startX + (ball.endX - ball.startX) * value;
      const y = ball.startY + (ball.endY - ball.startY) * value;

      if (getBallDistanceFromRingCenter(x, y, ring) < COLLISION_INNER_RADIUS) {
        resolvedRef.current = true;
        onEaten(ball.id);
        return;
      }

      if (ballHitsRing(x, y, ring)) {
        resolvedRef.current = true;
        onCollision();
      }
    });

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ball.duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && !resolvedRef.current) {
        onDone(ball.id);
      }
    });

    return () => {
      progress.removeListener(listenerId);
      animation.stop();
    };
  }, [ball, getRingState, onCollision, onDone, onEaten, progress]);

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
      style={[
        styles.ball,
        {
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

export default function FuryRing({ onHome }: FuryRingProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const rotation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bonusFeedback = useRef(new Animated.Value(0)).current;

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

  const [balls, setBalls] = useState<BallData[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [survivalPoints, setSurvivalPoints] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(sessionHighScore);

  windowHeightRef.current = windowHeight;

  const score = survivalPoints + bonusPoints;
  scoreRef.current = score;

  useEffect(() => {
    if (gameOver) {
      return;
    }

    const updateSurvivalPoints = () => {
      const elapsedSeconds = Math.floor(
        (Date.now() - runStartTimeRef.current) / 1000,
      );
      setSurvivalPoints(elapsedSeconds);
    };

    updateSurvivalPoints();
    const interval = setInterval(updateSurvivalPoints, 200);

    return () => {
      clearInterval(interval);
    };
  }, [gameOver]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!gameOverRef.current) {
        if (lastTimestampRef.current !== null) {
          const deltaMs = timestamp - lastTimestampRef.current;

          angleRef.current =
            (angleRef.current +
              directionRef.current * DEGREES_PER_MS * deltaMs +
              360) %
            360;

          rotation.setValue(angleRef.current);
        }

        lastTimestampRef.current = timestamp;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [rotation]);

  useEffect(() => {
    if (windowWidth <= 0 || windowHeight <= 0 || gameOver) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const spawnAndSchedule = () => {
      if (gameOverRef.current) {
        return;
      }

      const elapsedMs = Date.now() - runStartTimeRef.current;
      const maxActiveBalls = getMaxActiveBalls(elapsedMs);
      const spawnInterval = getSpawnInterval(elapsedMs);

      setBalls((currentBalls) => {
        if (currentBalls.length >= maxActiveBalls) {
          return currentBalls;
        }

        const ball = createBall(
          nextBallIdRef.current,
          windowWidth,
          windowHeight,
        );
        nextBallIdRef.current += 1;

        return [...currentBalls, ball];
      });

      timeoutId = setTimeout(spawnAndSchedule, spawnInterval);
    };

    spawnAndSchedule();

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [gameOver, windowHeight, windowWidth]);

  const removeBall = useCallback((id: number) => {
    setBalls((currentBalls) =>
      currentBalls.filter((ball) => ball.id !== id),
    );
  }, []);

  const showBonusFeedback = useCallback(() => {
    bonusFeedback.stopAnimation();
    bonusFeedback.setValue(0);

    Animated.sequence([
      Animated.timing(bonusFeedback, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(220),
      Animated.timing(bonusFeedback, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [bonusFeedback]);

  const handleEaten = useCallback(
    (id: number) => {
      removeBall(id);
      setBonusPoints((current) => current + EATEN_BALL_BONUS);
      showBonusFeedback();
    },
    [removeBall, showBonusFeedback],
  );

  const handleCollision = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    const currentScore = scoreRef.current;
    sessionHighScore = Math.max(sessionHighScore, currentScore);
    setFinalScore(currentScore);
    setHighScore(sessionHighScore);
    gameOverRef.current = true;
    setGameOver(true);
  }, []);

  const restartGame = useCallback(() => {
    setBalls([]);
    setSurvivalPoints(0);
    setBonusPoints(0);
    setFinalScore(0);
    bonusFeedback.stopAnimation();
    bonusFeedback.setValue(0);

    nextBallIdRef.current = 1;
    runStartTimeRef.current = Date.now();
    ringYRef.current = 0;
    dragStartYRef.current = 0;
    maxDragDistanceRef.current = 0;
    translateY.setValue(0);

    angleRef.current = 0;
    directionRef.current = 1;
    lastTimestampRef.current = null;
    rotation.setValue(0);

    gameOverRef.current = false;
    setGameOver(false);
  }, [bonusFeedback, rotation, translateY]);

  const getRingState = useCallback(
    (): RingState => ({
      y: ringYRef.current,
      angle: angleRef.current,
      gameOver: gameOverRef.current,
    }),
    [],
  );

  const reverseDirection = () => {
    if (!gameOverRef.current) {
      directionRef.current *= -1;
    }
  };

  const getVerticalLimit = () =>
    Math.max(
      0,
      windowHeightRef.current / 2 -
        RADIUS -
        STROKE_WIDTH / 2 -
        EDGE_MARGIN,
    );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !gameOverRef.current,
      onStartShouldSetPanResponderCapture: () => !gameOverRef.current,
      onMoveShouldSetPanResponder: () => !gameOverRef.current,
      onMoveShouldSetPanResponderCapture: () => !gameOverRef.current,
      onPanResponderGrant: () => {
        dragStartYRef.current = ringYRef.current;
        maxDragDistanceRef.current = 0;
      },
      onPanResponderMove: (_event, gestureState) => {
        if (gameOverRef.current) {
          return;
        }

        const dragDistance = Math.hypot(gestureState.dx, gestureState.dy);
        maxDragDistanceRef.current = Math.max(
          maxDragDistanceRef.current,
          dragDistance,
        );

        const verticalLimit = getVerticalLimit();
        const nextY = clamp(
          dragStartYRef.current + gestureState.dy,
          -verticalLimit,
          verticalLimit,
        );

        ringYRef.current = nextY;
        translateY.setValue(nextY);
      },
      onPanResponderRelease: () => {
        if (
          !gameOverRef.current &&
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

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const bonusScale = bonusFeedback.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  return (
    <ImageBackground
      source={{ uri: "/nightsky.png" }}
      resizeMode="cover"
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {!gameOver && (
        <Text pointerEvents="none" style={styles.scoreText}>
          Score: {score}
        </Text>
      )}

      {balls.map((ball) => (
        <SpawnBall
          key={ball.id}
          ball={ball}
          getRingState={getRingState}
          onCollision={handleCollision}
          onEaten={handleEaten}
          onDone={removeBall}
        />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.movementLayer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.ringSurface,
            {
              transform: [{ rotate }],
            },
          ]}
        >
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

        <Animated.Text
          style={[
            styles.bonusText,
            {
              opacity: bonusFeedback,
              transform: [{ scale: bonusScale }],
            },
          ]}
        >
          +{EATEN_BALL_BONUS}
        </Animated.Text>
      </Animated.View>

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverScoreRow}>
            <Text style={styles.gameOverScoreText}>Score: {finalScore}</Text>
            <Text style={styles.gameOverHighScoreText}>High Score: {highScore}</Text>
          </View>

          <Image
            source={{ uri: "/fury-game-over.svg" }}
            resizeMode="contain"
            style={styles.gameOverArtwork}
          />

          <Pressable style={styles.playAgainButton} onPress={restartGame}>
            <Text style={styles.playAgainButtonText}>SPILL IGJEN</Text>
          </Pressable>

          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeButtonText}>HJEM</Text>
          </Pressable>
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
  movementLayer: {
    width: SIZE,
    height: SIZE,
  },
  ringSurface: {
    width: SIZE,
    height: SIZE,
  },
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
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.56)",
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 28,
  },
  gameOverScoreRow: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gameOverScoreText: {
    fontSize: 18,
    fontWeight: "900",
    color: RING_COLOR,
    fontVariant: ["tabular-nums"],
  },
  gameOverHighScoreText: {
    fontSize: 18,
    fontWeight: "900",
    color: BALL_COLOR,
    fontVariant: ["tabular-nums"],
  },
  gameOverArtwork: {
    width: "100%",
    maxWidth: 520,
    aspectRatio: 459.75 / 90,
    marginTop: 80,
    marginBottom: 64,
  },
  playAgainButton: {
    width: "78%",
    maxWidth: 320,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: RING_COLOR,
    paddingHorizontal: 24,
  },
  playAgainButtonText: {
    color: "#08111f",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  homeButton: {
    marginTop: 16,
    minWidth: 132,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BALL_COLOR,
    paddingHorizontal: 26,
  },
  homeButtonText: {
    color: TEXT_COLOR,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});