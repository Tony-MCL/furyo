import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 100;
const STROKE_WIDTH = 18;

const GAP_DEGREES = 60;
const ROTATION_DURATION_MS = 2500;

const circumference = 2 * Math.PI * RADIUS;
const visibleFraction = (360 - GAP_DEGREES) / 360;
const visibleLength = circumference * visibleFraction;
const gapLength = circumference - visibleLength;

// Flytter åpningen til høyre side uten SVG-transformasjon.
const dashOffset = -gapLength / 2;

export default function FuryRing() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: ROTATION_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: false,
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
    width: SIZE,
    height: SIZE,
  },
});