import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

/** Subtle radial-ish gradient backdrop used across all screens. */
export function Background({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0A0E11", "#0F1A14", "#0A0E11"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  blob1: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: "rgba(0,216,122,0.18)",
    opacity: 0.5,
  },
  blob2: {
    position: "absolute",
    bottom: -160,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 220,
    backgroundColor: "rgba(0,216,122,0.10)",
    opacity: 0.6,
  },
});
