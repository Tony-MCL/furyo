import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

const CANVAS_SIZE = 320;
const RING_CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = 100;
const RING_STROKE_WIDTH = 18;
const GAP_SIZE_DEGREES = 60;

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
  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Path
          path={ringPath}
          color="black"
          style="stroke"
          strokeWidth={RING_STROKE_WIDTH}
          strokeCap="round"
        />
      </Canvas>
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

  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
});