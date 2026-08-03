import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

const CANVAS_SIZE = 320;
const RING_CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = 100;
const RING_STROKE_WIDTH = 18;
const GAP_SIZE_DEGREES = 60;
const ROTATION_DURATION_MS = 2500;

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
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: ROTATION_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
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