import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function ProScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);

  const upgrade = async () => {
    setBusy(true);
    try {
      const r = (await api.post("/billing/create-checkout-session", {
        return_url_base:
          Platform.OS === "web" && typeof window !== "undefined"
            ? window.location.origin
            : process.env.EXPO_PUBLIC_BACKEND_URL,
      })) as { checkout_url: string };
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.location.href = r.checkout_url;
      } else {
        await WebBrowser.openBrowserAsync(r.checkout_url);
        // After returning, ask backend to poll Stripe
        await api.post("/subscription/refresh");
        await refresh();
        router.replace("/(tabs)/settings");
      }
    } catch (e: any) {
      Alert.alert("Stripe error", e?.message || "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  const perk = (icon: any, title: string, sub: string) => (
    <View style={styles.perkRow}>
      <View style={styles.perkIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.perkTitle}>{title}</Text>
        <Text style={styles.perkSub}>{sub}</Text>
      </View>
    </View>
  );

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard testID="pro-hero">
            <Text style={styles.kicker}>GIG-GUARD PRO</Text>
            <Text style={styles.price} testID="pro-price">$4.99<Text style={styles.priceSub}>/mo</Text></Text>
            <Text style={styles.tag}>One latte a month. Hundreds in tax savings.</Text>
          </GlassCard>

          <GlassCard testID="pro-perks" style={{ marginTop: spacing(2) }}>
            {perk("infinite", "Unlimited trips", "Free tier is capped at 10 trips/month.")}
            {perk("cloud-upload", "Receipt cloud storage", "Original photos kept securely for 7 years.")}
            {perk("download", "One-Click Tax Export", "CSV ready for your accountant or tax tool.")}
            {perk("flash", "Priority OCR", "Faster vendor & amount auto-fill.")}
          </GlassCard>

          <Pressable
            testID="pro-checkout-button"
            onPress={upgrade}
            disabled={busy}
            style={({ pressed }) => [styles.cta, { opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            {busy ? <ActivityIndicator color="#04130A" /> : (
              <>
                <Ionicons name="lock-closed" size={18} color="#04130A" />
                <Text style={styles.ctaText}>Start subscription with Stripe</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.fine}>
            Auto-renews monthly at $4.99 USD until cancelled. Manage or cancel any time from Account → Manage subscription, or directly in your Stripe receipt email. Cancellation takes effect at the end of the current billing period. Payment is charged to your card via Stripe; this app does not use Apple In-App Purchase or Google Play Billing.
          </Text>
          <Text style={styles.fine}>14-day money-back guarantee · Test mode: card 4242 4242 4242 4242 works.</Text>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), paddingBottom: spacing(6) },
  kicker: { color: colors.primary, ...font.small, letterSpacing: 2, textTransform: "uppercase" },
  price: { color: colors.text, fontSize: 64, fontWeight: "800", marginTop: 6 },
  priceSub: { fontSize: 18, color: colors.textDim, fontWeight: "600" },
  tag: { color: colors.textDim, ...font.body, marginTop: 4 },
  perkRow: { flexDirection: "row", alignItems: "center", marginVertical: 8, gap: 12 },
  perkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,216,122,0.15)", borderWidth: 1, borderColor: colors.border },
  perkTitle: { color: colors.text, ...font.h3 },
  perkSub: { color: colors.textDim, ...font.small, marginTop: 2 },
  cta: {
    marginTop: spacing(3), backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },
  ctaText: { color: "#04130A", ...font.h3, fontWeight: "800", letterSpacing: 0.3 },
  fine: { color: colors.textMute, ...font.small, textAlign: "center", marginTop: spacing(2) },
});
