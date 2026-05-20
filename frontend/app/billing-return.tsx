import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function BillingReturn() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const router = useRouter();
  const { refresh, user } = useAuth();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (status === "success") {
          await api.post("/subscription/refresh");
        }
      } catch {}
      await refresh();
      setBusy(false);
    })();
  }, [refresh, status]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom", "top"]}>
        <View style={styles.wrap}>
          <GlassCard testID="billing-return-card">
            <View style={{ alignItems: "center", padding: spacing(2) }}>
              <Ionicons
                name={status === "success" ? "checkmark-circle" : "alert-circle"}
                size={56}
                color={status === "success" ? colors.primary : colors.textDim}
              />
              <Text style={styles.title} testID="billing-status-title">
                {busy ? "Verifying…" : status === "success" ? "You're Pro!" : "Checkout canceled"}
              </Text>
              <Text style={styles.sub}>
                {busy
                  ? "Confirming with Stripe…"
                  : status === "success"
                  ? user?.is_pro
                    ? "Unlimited trips, receipt cloud storage and tax export are now unlocked."
                    : "Payment received. It may take a few seconds to reflect — pull-to-refresh on Account."
                  : "No charge was made. You can try again whenever you're ready."}
              </Text>
              {busy && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
              <Pressable
                testID="billing-return-continue"
                onPress={() => router.replace("/(tabs)")}
                style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.btnText}>Continue</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing(2), justifyContent: "center" },
  title: { color: colors.text, ...font.h1, marginTop: spacing(2), textAlign: "center" },
  sub: { color: colors.textDim, ...font.body, textAlign: "center", marginTop: 8 },
  btn: { marginTop: spacing(3), backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: "#04130A", ...font.h3, fontWeight: "800" },
});
