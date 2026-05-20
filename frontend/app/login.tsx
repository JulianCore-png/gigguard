import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={styles.logo} testID="brand-logo">
                <Ionicons name="shield-checkmark" size={28} color="#04130A" />
              </View>
              <Text style={styles.brandText}>Gig-Guard</Text>
              <Text style={styles.brandTag}>Maximize your tax deductions in one tap.</Text>
            </View>

            <GlassCard testID="login-card" style={{ marginTop: spacing(3) }}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue tracking your earnings.</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMute}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMute}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {err && (
                <Text testID="login-error" style={styles.error}>
                  {err}
                </Text>
              )}

              <Pressable
                testID="login-submit-button"
                onPress={onSubmit}
                disabled={busy || !email || !password}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { opacity: busy || !email || !password ? 0.5 : pressed ? 0.85 : 1 },
                ]}
              >
                {busy ? <ActivityIndicator color="#04130A" /> : <Text style={styles.primaryBtnText}>Sign in</Text>}
              </Pressable>

              <Pressable testID="goto-register-button" onPress={() => router.push("/register")} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>New here? Create an account</Text>
              </Pressable>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(3), paddingTop: spacing(6), gap: spacing(2) },
  brand: { alignItems: "center", gap: spacing(1) },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  brandText: { ...font.h1, color: colors.text, marginTop: 8 },
  brandTag: { ...font.body, color: colors.textDim, textAlign: "center" },
  title: { ...font.h2, color: colors.text },
  subtitle: { ...font.body, color: colors.textDim, marginTop: 4, marginBottom: spacing(2) },
  label: { ...font.small, color: colors.textDim, marginTop: spacing(1.5), marginBottom: 6, textTransform: "uppercase" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    ...font.body,
  },
  error: { color: colors.danger, marginTop: spacing(1) },
  primaryBtn: {
    marginTop: spacing(3),
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  primaryBtnText: { ...font.h3, color: "#04130A", letterSpacing: 0.4, textTransform: "uppercase" },
  ghostBtn: { alignItems: "center", marginTop: spacing(2) },
  ghostText: { color: colors.primary, ...font.body },
});
