import React, { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

const CANVAS_SIZE = 320;
const RING_CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = 100;
const RING_STROKE_WIDTH = 18;
const GAP_SIZE_DEGREES = 60;
const ROTATION_DURATION_MS = 4000;
const DEGREES_PER_MS = 360 / ROTATION_DURATION_MS;
const TAP_MOVEMENT_THRESHOLD = 8;
const EDGE_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
  const { height: windowHeight } = useWindowDimensions();

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