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
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await register(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={styles.h1}>Create your account</Text>
              <Text style={styles.p}>Free forever — 10 trips/month. Pro is $4.99/mo for unlimited.</Text>
            </View>
            <GlassCard testID="register-card" style={{ marginTop: spacing(3) }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="register-email-input"
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
                testID="register-password-input"
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMute}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {err && (
                <Text testID="register-error" style={styles.error}>
                  {err}
                </Text>
              )}
              <Pressable
                testID="register-submit-button"
                onPress={onSubmit}
                disabled={busy || !email || !password}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { opacity: busy || !email || !password ? 0.5 : pressed ? 0.85 : 1 },
                ]}
              >
                {busy ? <ActivityIndicator color="#04130A" /> : <Text style={styles.primaryBtnText}>Create account</Text>}
              </Pressable>
              <Pressable testID="goto-login-button" onPress={() => router.replace("/login")} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Already have an account? Sign in</Text>
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
  h1: { ...font.h1, color: colors.text },
  p: { ...font.body, color: colors.textDim, marginTop: 6 },
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
