import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
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

const TEST_OBJECT_SIZE = 12;
const TEST_OBJECT_TRAVEL_MS = 3500;

const circumference = 2 * Math.PI * RADIUS;
const visibleFraction = (360 - GAP_DEGREES) / 360;
const visibleLength = circumference * visibleFraction;
const gapLength = circumference - visibleLength;
const dashOffset = -gapLength / 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function FuryRing() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const rotation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const testObjectProgress = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    testObjectProgress.setValue(0);

    const animation = Animated.loop(
      Animated.timing(testObjectProgress, {
        toValue: 1,
        duration: TEST_OBJECT_TRAVEL_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [testObjectProgress, windowWidth]);

  const reverseDirection = () => {
    directionRef.current *= -1;
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

  const objectTranslateX = testObjectProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      windowWidth / 2 + TEST_OBJECT_SIZE,
      -(windowWidth / 2 + TEST_OBJECT_SIZE),
    ],
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.testObject,
          {
            transform: [{ translateX: objectTranslateX }],
          },
        ]}
      />

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
              stroke="black"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${visibleLength} ${gapLength}`}
              strokeDashoffset={dashOffset}
            />
          </Svg>
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
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
  },
  testObject: {
    position: "absolute",
    width: TEST_OBJECT_SIZE,
    height: TEST_OBJECT_SIZE,
    borderRadius: TEST_OBJECT_SIZE / 2,
    backgroundColor: "black",
  },
  movementLayer: {
    width: SIZE,
    height: SIZE,
  },
  ringSurface: {
    width: SIZE,
    height: SIZE,
  },
});