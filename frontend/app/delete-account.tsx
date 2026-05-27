import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { colors, font, radii, spacing } from "@/src/theme";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

/**
 * Public (unauthenticated) account-deletion request page.
 * Required by Google Play Console (May 31, 2024) — a web URL where users
 * who can no longer sign in can still request deletion of their data.
 * Apple App Store also accepts this as part of Guideline 5.1.1(v) compliance.
 */
export default function DeleteAccountRequestScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Email required", "Please enter the email associated with your Gig-Guard account.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/legal/deletion-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
    } catch (e: any) {
      Alert.alert("Could not send", e?.message || "Please email julian.davis29@outlook.com directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <GlassCard testID="delete-request-card">
              <Text style={styles.h1}>Delete my account</Text>
              <Text style={styles.p}>
                <Text style={styles.bold}>Fastest way:</Text> if you can still sign in, open the Gig-Guard app, go to{" "}
                <Text style={styles.bold}>Account → Privacy & my data → Delete my account</Text>. The deletion is
                immediate and includes all your trips, receipts, and Pro subscription.
              </Text>
              <Text style={styles.p}>
                <Text style={styles.bold}>Can't sign in?</Text> Submit a request below and Julian Davis will manually
                delete your account and all related data within 30 days, per applicable privacy law.
              </Text>
              <Text style={styles.p}>
                What we delete on request: your account record, all trip logs (GPS, miles, deductions), all receipts
                (images and OCR-extracted fields), and your Stripe customer record. Any active Pro subscription is
                cancelled immediately.
              </Text>
            </GlassCard>

            {sent ? (
              <GlassCard style={{ marginTop: spacing(2), borderColor: colors.primary }} testID="delete-request-success">
                <View style={{ alignItems: "center" }}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                  <Text style={[styles.h2, { textAlign: "center", marginTop: 8 }]}>Request received</Text>
                  <Text style={[styles.p, { textAlign: "center" }]}>
                    We've logged your deletion request. You'll get a confirmation at <Text style={styles.bold}>{email}</Text>{" "}
                    once processed. Questions? Email{" "}
                    <Text style={styles.link}>julian.davis29@outlook.com</Text>.
                  </Text>
                </View>
              </GlassCard>
            ) : (
              <GlassCard style={{ marginTop: spacing(2) }} testID="delete-request-form">
                <Text style={styles.label}>Your account email</Text>
                <TextInput
                  testID="delete-request-email"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMute}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.label}>Reason (optional)</Text>
                <TextInput
                  testID="delete-request-reason"
                  style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Help us improve — why are you leaving?"
                  placeholderTextColor={colors.textMute}
                  multiline
                />
                <Pressable
                  testID="delete-request-submit"
                  onPress={submit}
                  disabled={busy}
                  style={({ pressed }) => [styles.cta, { opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={18} color="#fff" />
                      <Text style={styles.ctaText}>Submit deletion request</Text>
                    </>
                  )}
                </Pressable>
              </GlassCard>
            )}

            <Pressable testID="back-to-login" onPress={() => router.replace("/login")} style={{ alignSelf: "center", marginTop: spacing(3) }}>
              <Text style={{ color: colors.primary, ...font.body }}>← Back to sign in</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), paddingTop: spacing(4) },
  h1: { color: colors.text, ...font.h1 },
  h2: { color: colors.text, ...font.h2 },
  p: { color: colors.textDim, ...font.body, marginTop: spacing(1.5), lineHeight: 22 },
  bold: { color: colors.text, fontWeight: "800" },
  link: { color: colors.primary, textDecorationLine: "underline" },
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
  },
  cta: {
    marginTop: spacing(3),
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { color: "#fff", ...font.h3, fontWeight: "800" },
});
