import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/src/api/auth";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0A0E11" },
            headerTintColor: "#fff",
            contentStyle: { backgroundColor: "#0A0E11" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="receipt-capture" options={{ title: "Snap Receipt", presentation: "modal" }} />
          <Stack.Screen name="pro" options={{ title: "Upgrade to Pro", presentation: "modal" }} />
          <Stack.Screen name="export" options={{ title: "Tax-Ready Export" }} />
          <Stack.Screen name="billing-return" options={{ title: "Subscription" }} />
          <Stack.Screen name="privacy-center" options={{ title: "Privacy & Data" }} />
          <Stack.Screen name="terms" options={{ title: "Terms of Service" }} />
          <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
