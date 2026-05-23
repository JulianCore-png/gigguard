import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function AccountPrivacyScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const doExport = async () => {
    setExporting(true);
    try {
      const data = (await api.get("/auth/me/export")) as any;
      const pretty = JSON.stringify(data, null, 2);
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          const blob = new Blob([pretty], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `gigguard-export-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        await Share.share({
          message: pretty,
          title: "Gig-Guard — my data export",
        });
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message || "Try again");
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      Alert.alert("Type DELETE to confirm", "Please type the word DELETE (all caps) to permanently delete your account.");
      return;
    }
    setDeleting(true);
    try {
      const r = (await api.delete("/auth/me")) as any;
      Alert.alert(
        "Account deleted",
        `We removed ${r.trips_deleted ?? 0} trips and ${r.receipts_deleted ?? 0} receipts.` +
          (r.stripe_subscription === "canceled" ? " Your Pro subscription was cancelled." : ""),
      );
      await logout();
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Try again");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <GlassCard testID="privacy-intro">
              <Text style={styles.h1}>Your data, your rules</Text>
              <Text style={styles.sub}>
                You can download everything we have about you, or permanently delete your account. These options are required by
                Apple App Store policy and applicable privacy law (GDPR/CCPA).
              </Text>
              <Text style={styles.email}>Signed in as {user?.email}</Text>
            </GlassCard>

            {/* Export */}
            <GlassCard testID="export-data-card" style={{ marginTop: spacing(2) }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.h3}>Download my data</Text>
                  <Text style={styles.sub}>
                    Exports your account, trips, and receipts as a JSON file you can share with your accountant or keep for your
                    records.
                  </Text>
                </View>
                <Ionicons name="cloud-download" size={28} color={colors.primary} />
              </View>
              <Pressable
                testID="export-data-button"
                onPress={doExport}
                disabled={exporting}
                style={({ pressed }) => [styles.ctaPrimary, { opacity: exporting ? 0.6 : pressed ? 0.85 : 1 }]}
              >
                {exporting ? <ActivityIndicator color="#04130A" /> : <Text style={styles.ctaPrimaryText}>Export my data</Text>}
              </Pressable>
            </GlassCard>

            {/* Delete */}
            <GlassCard testID="delete-account-card" style={{ marginTop: spacing(2), borderColor: colors.danger }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.h3, { color: colors.danger }]}>Delete my account</Text>
                  <Text style={styles.sub}>
                    Permanently removes your account, all trips, and all receipts. If you have an active Pro subscription it will
                    be cancelled immediately. This cannot be undone.
                  </Text>
                </View>
                <Ionicons name="trash" size={28} color={colors.danger} />
              </View>
              <Text style={styles.label}>Type DELETE to confirm</Text>
              <TextInput
                testID="delete-confirm-input"
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="DELETE"
                placeholderTextColor={colors.textMute}
                autoCapitalize="characters"
                style={styles.input}
              />
              <Pressable
                testID="delete-account-button"
                onPress={doDelete}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.ctaDanger,
                  { opacity: deleting ? 0.6 : pressed ? 0.85 : 1, backgroundColor: confirmText.trim().toUpperCase() === "DELETE" ? colors.danger : "#52242A" },
                ]}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={styles.ctaDangerText}>Permanently delete my account</Text>
                  </>
                )}
              </Pressable>
            </GlassCard>

            {/* Legal */}
            <GlassCard testID="legal-card" style={{ marginTop: spacing(2) }}>
              <Text style={styles.h3}>Legal</Text>
              <Pressable testID="open-terms-button" onPress={() => router.push("/terms")} style={styles.legalRow}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={styles.legalRowText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
              <Pressable testID="open-privacy-button" onPress={() => router.push("/privacy")} style={styles.legalRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={styles.legalRowText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), paddingBottom: spacing(6) },
  h1: { color: colors.text, ...font.h1 },
  h3: { color: colors.text, ...font.h3 },
  sub: { color: colors.textDim, ...font.body, marginTop: 6, lineHeight: 21 },
  email: { color: colors.primary, ...font.small, marginTop: spacing(2) },
  rowBetween: { flexDirection: "row", alignItems: "center" },
  label: { color: colors.textDim, ...font.small, marginTop: spacing(2), marginBottom: 6, textTransform: "uppercase" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    ...font.body,
    letterSpacing: 2,
  },
  ctaPrimary: {
    marginTop: spacing(2),
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPrimaryText: { color: "#04130A", ...font.h3, fontWeight: "800" },
  ctaDanger: {
    marginTop: spacing(2),
    borderRadius: radii.pill,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaDangerText: { color: "#fff", ...font.h3, fontWeight: "800" },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legalRowText: { color: colors.text, ...font.body, flex: 1 },
});
