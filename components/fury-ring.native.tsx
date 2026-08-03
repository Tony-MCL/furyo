import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

const CANVAS_SIZE = 79;
const RING_CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = 24;
const RING_STROKE_WIDTH = 5;
const GAP_SIZE_DEGREES = 75;
const ROTATION_DURATION_MS = 5200;
const DEGREES_PER_MS = 360 / ROTATION_DURATION_MS;
const TAP_MOVEMENT_THRESHOLD = 8;
const EDGE_MARGIN = 16;

const BALL_SIZE = 12;
const BALL_RADIUS = BALL_SIZE / 2;
const BALL_SPAWN_INTERVAL_START_MS = 1100;
const BALL_SPAWN_INTERVAL_FINAL_MS = 350;
const BALL_MIN_TRAVEL_MS = 3600;
const BALL_MAX_TRAVEL_MS = 5000;
const START_MAX_BALLS = 5;
const FINAL_MAX_BALLS = 12;
const BALL_COUNT_STEP_MS = 15000;
const TOP_BOTTOM_CENTER_EXCLUSION_RATIO = 0.25;

const COLLISION_HALF_WIDTH = RING_STROKE_WIDTH / 2 + BALL_RADIUS;
const COLLISION_INNER_RADIUS = RING_RADIUS - COLLISION_HALF_WIDTH;
const COLLISION_OUTER_RADIUS = RING_RADIUS + COLLISION_HALF_WIDTH;
const BALL_ANGULAR_CLEARANCE_DEGREES =
  (Math.asin(Math.min(1, BALL_RADIUS / RING_RADIUS)) * 180) / Math.PI;
const SAFE_GAP_HALF_DEGREES =
  GAP_SIZE_DEGREES / 2 - BALL_ANGULAR_CLEARANCE_DEGREES;

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
  const progress =
    (maxActiveBalls - START_MAX_BALLS) /
    (FINAL_MAX_BALLS - START_MAX_BALLS);

  return Math.round(
    BALL_SPAWN_INTERVAL_START_MS +
      (BALL_SPAWN_INTERVAL_FINAL_MS - BALL_SPAWN_INTERVAL_START_MS) *
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

function createRingPath() {
  const path = Skia.Path.Make();

  const diameter = RING_RADIUS * 2;

  const rect = {
    x: RING_CENTER - RING_RADIUS,
    y: RING_CENTER - RING_RADIUS,
    width: diameter,
    height: diameter,
  };

  const startAngle = GAP_SIZE_DEGREES / 2;
  const sweepAngle = 360 - GAP_SIZE_DEGREES;

  path.addArc(rect, startAngle, sweepAngle);

  return path;
}

const ringPath = createRingPath();

export default function FuryRing() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const rotation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

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

  const [balls, setBalls] = useState<BallData[]>([]);
  const [gameOver, setGameOver] = useState(false);

  windowHeightRef.current = windowHeight;

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

  const handleCollision = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    gameOverRef.current = true;
    setGameOver(true);
  }, []);

  const restartGame = useCallback(() => {
    setBalls([]);
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
  }, [rotation, translateY]);

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
        RING_RADIUS -
        RING_STROKE_WIDTH / 2 -
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

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {balls.map((ball) => (
        <SpawnBall
          key={ball.id}
          ball={ball}
          getRingState={getRingState}
          onCollision={handleCollision}
          onEaten={removeBall}
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
          <Canvas style={styles.canvas}>
            <Path
              path={ringPath}
              color="black"
              style="stroke"
              strokeWidth={RING_STROKE_WIDTH}
              strokeCap="round"
            />
          </Canvas>
        </Animated.View>
      </Animated.View>

      {gameOver && (
        <Pressable style={styles.gameOverOverlay} onPress={restartGame}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.restartText}>Tap to restart</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    overflow: "hidden",
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
    backgroundColor: "black",
  },
  movementLayer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  ringSurface: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
    color: "black",
  },
  restartText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
});