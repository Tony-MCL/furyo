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
  StyleSheet,
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
const BALL_SPAWN_INTERVAL_MS = 1100;
const BALL_MIN_TRAVEL_MS = 3600;
const BALL_MAX_TRAVEL_MS = 5000;
const MAX_BALLS = 5;
const TOP_BOTTOM_CENTER_EXCLUSION_RATIO = 0.25;

type Edge = "top" | "right" | "bottom" | "left";

type BallData = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
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

type SpawnBallProps = {
  ball: BallData;
  onDone: (id: number) => void;
};

function SpawnBall({ ball, onDone }: SpawnBallProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ball.duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onDone(ball.id);
      }
    });

    return () => {
      animation.stop();
    };
  }, [ball, onDone, progress]);

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

  const [balls, setBalls] = useState<BallData[]>([]);

  windowHeightRef.current = windowHeight;

  useEffect(() => {
    const animate = (timestamp: number) => {
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
    if (windowWidth <= 0 || windowHeight <= 0) {
      return;
    }

    const spawnBall = () => {
      setBalls((currentBalls) => {
        if (currentBalls.length >= MAX_BALLS) {
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
    };

    spawnBall();
    const interval = setInterval(spawnBall, BALL_SPAWN_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setBalls([]);
    };
  }, [windowHeight, windowWidth]);

  const removeBall = useCallback((id: number) => {
    setBalls((currentBalls) =>
      currentBalls.filter((ball) => ball.id !== id),
    );
  }, []);

  const reverseDirection = () => {
    directionRef.current *= -1;
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
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        dragStartYRef.current = ringYRef.current;
        maxDragDistanceRef.current = 0;
      },
      onPanResponderMove: (_event, gestureState) => {
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
        if (maxDragDistanceRef.current < TAP_MOVEMENT_THRESHOLD) {
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
        <SpawnBall key={ball.id} ball={ball} onDone={removeBall} />
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
});