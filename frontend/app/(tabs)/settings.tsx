import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function SettingsTab() {
  const { user, logout, refresh } = useAuth();
  const router = useRouter();

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.h1}>Account</Text>

          <GlassCard testID="account-card" style={{ marginTop: spacing(2) }}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.tierRow}>
              <View style={[styles.badge, { backgroundColor: user?.is_pro ? colors.primary : colors.surface }]} testID="settings-tier-badge">
                <Text style={{ color: user?.is_pro ? "#04130A" : colors.textDim, fontWeight: "800" }}>
                  {user?.is_pro ? "PRO" : "FREE"}
                </Text>
              </View>
              <Text style={styles.tierText}>
                {user?.is_pro ? "Unlimited trips + receipt cloud storage + tax export." : "10 trips/mo · Tap below to upgrade."}
              </Text>
            </View>
          </GlassCard>

          {!user?.is_pro && (
            <Pressable testID="settings-upgrade-button" onPress={() => router.push("/pro")}>
              <GlassCard style={{ marginTop: spacing(2), borderColor: colors.primary, borderWidth: 1 }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>Upgrade to Pro · $4.99/mo</Text>
                    <Text style={styles.sub}>Unlimited trips, receipt cloud storage, one-tap tax export.</Text>
                  </View>
                  <Ionicons name="sparkles" size={28} color={colors.primary} />
                </View>
              </GlassCard>
            </Pressable>
          )}

          {user?.is_pro && (
            <Pressable testID="settings-manage-sub-button" onPress={async () => {
              try {
                const { api } = await import("@/src/api/client");
                const r = (await api.post("/billing/portal", {
                  return_url_base:
                    Platform.OS === "web" && typeof window !== "undefined"
                      ? window.location.origin
                      : process.env.EXPO_PUBLIC_BACKEND_URL,
                })) as { portal_url: string };
                if (Platform.OS === "web" && typeof window !== "undefined") {
                  window.location.href = r.portal_url;
                } else {
                  const WB = await import("expo-web-browser");
                  await WB.openBrowserAsync(r.portal_url);
                  await refresh();
                }
              } catch (e: any) {
                // surfaced by inner alert in api client; no-op here
              }
            }}>
              <GlassCard style={{ marginTop: spacing(2) }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>Manage subscription</Text>
                    <Text style={styles.sub}>Update card, change plan, or cancel via Stripe.</Text>
                  </View>
                  <Ionicons name="card" size={22} color={colors.primary} />
                </View>
              </GlassCard>
            </Pressable>
          )}

          <Pressable testID="settings-export-button" onPress={() => router.push("/export")}>
            <GlassCard style={{ marginTop: spacing(2) }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>Tax-Ready Export</Text>
                  <Text style={styles.sub}>Generate a CSV for your accountant in one tap.</Text>
                </View>
                <Ionicons name="download" size={26} color={colors.primary} />
              </View>
            </GlassCard>
          </Pressable>

          <Pressable testID="settings-refresh-sub-button" onPress={async () => {
            try {
              await api_refresh();
              await refresh();
            } catch {}
          }}>
            <GlassCard style={{ marginTop: spacing(2) }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>Refresh subscription status</Text>
                  <Text style={styles.sub}>Just paid? Tap to sync with Stripe.</Text>
                </View>
                <Ionicons name="refresh" size={22} color={colors.textDim} />
              </View>
            </GlassCard>
          </Pressable>

          <Pressable testID="settings-privacy-button" onPress={() => router.push("/privacy-center")}>
            <GlassCard style={{ marginTop: spacing(2) }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>Privacy & my data</Text>
                  <Text style={styles.sub}>Download your data or permanently delete your account.</Text>
                </View>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
            </GlassCard>
          </Pressable>

          <Pressable testID="settings-logout-button" onPress={logout}>
            <GlassCard style={{ marginTop: spacing(2) }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.h3, { color: colors.danger }]}>Log out</Text>
                <Ionicons name="log-out" size={22} color={colors.danger} />
              </View>
            </GlassCard>
          </Pressable>

          <Text style={styles.footer}>Gig-Guard · IRS rate $0.67/mi · Tax help is informational, not financial advice.</Text>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

// helper to call refresh endpoint
async function api_refresh() {
  const { api } = await import("@/src/api/client");
  return api.post("/subscription/refresh");
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), paddingBottom: spacing(12) },
  h1: { color: colors.text, ...font.h1 },
  h3: { color: colors.text, ...font.h3 },
  sub: { color: colors.textDim, ...font.small, marginTop: 4 },
  label: { color: colors.textDim, ...font.small, textTransform: "uppercase" },
  email: { color: colors.text, ...font.h3, marginTop: 4 },
  tierRow: { flexDirection: "row", alignItems: "center", marginTop: spacing(2), gap: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  tierText: { color: colors.textDim, ...font.small, flex: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center" },
  footer: { color: colors.textMute, ...font.small, textAlign: "center", marginTop: spacing(4) },
});
