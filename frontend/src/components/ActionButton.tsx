import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radii } from "../theme";

export function ActionButton({
  label,
  onPress,
  active = false,
  testID,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  testID?: string;
  disabled?: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.in(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });

  const bg = active ? "#1A1F25" : colors.primary;
  const fg = active ? colors.primary : "#04130A";
  const ring = active ? "rgba(0,216,122,0.5)" : "rgba(0,216,122,0.95)";

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.glow,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
            backgroundColor: colors.glow,
          },
        ]}
      />
      <Pressable
        testID={testID}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: bg,
            borderColor: ring,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: 260,
    height: 110,
    borderRadius: radii.pill,
  },
  btn: {
    minWidth: 240,
    paddingHorizontal: 36,
    paddingVertical: 22,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  label: {
    ...font.h2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
