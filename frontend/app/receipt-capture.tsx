import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { colors, font, radii, spacing } from "@/src/theme";

export default function ReceiptCaptureScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null); // base64 (no prefix)
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("fuel");
  const [busy, setBusy] = useState(false);
  const [ocrRan, setOcrRan] = useState(false);

  const pick = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to continue.");
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      base64: true,
      quality: 0.6,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
    };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const b64 = res.assets[0].base64 || "";
    setImage(b64);
    setOcrRan(false);
  };

  const runOcr = async () => {
    if (!image) return;
    setBusy(true);
    try {
      const r = (await api.post("/receipts", { image_base64: image })) as any;
      // Reload receipts on next tab visit — preview the extracted fields
      setVendor(r.vendor || "");
      setAmount(r.amount != null ? String(r.amount) : "");
      setDate(r.date || "");
      setCategory(r.category || "other");
      setOcrRan(true);
      Alert.alert("Saved", "Receipt added with OCR-extracted details. You can review them on the Receipts tab.");
      router.back();
    } catch (e: any) {
      Alert.alert("OCR failed", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  const saveManual = async () => {
    setBusy(true);
    try {
      await api.post("/receipts", {
        image_base64: image,
        vendor: vendor || undefined,
        amount: amount ? Number(amount) : undefined,
        date: date || undefined,
        category,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard testID="capture-card">
            <Text style={styles.title}>Add a receipt</Text>
            <Text style={styles.sub}>Take a photo or pick from your library. We'll auto-fill vendor, amount, date and category.</Text>

            <View style={styles.btnRow}>
              <Pressable testID="capture-camera-button" onPress={() => pick(true)} style={[styles.actionBtn, styles.primaryAction]}>
                <Ionicons name="camera" size={20} color="#04130A" />
                <Text style={styles.primaryActionText}>Camera</Text>
              </Pressable>
              <Pressable testID="capture-library-button" onPress={() => pick(false)} style={[styles.actionBtn, styles.secondaryAction]}>
                <Ionicons name="images" size={20} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Library</Text>
              </Pressable>
            </View>

            {image && (
              <Image
                testID="receipt-preview"
                source={{ uri: `data:image/jpeg;base64,${image}` }}
                style={{ width: "100%", height: 220, borderRadius: radii.md, marginTop: spacing(2) }}
                resizeMode="cover"
              />
            )}

            {image && (
              <Pressable
                testID="run-ocr-button"
                onPress={runOcr}
                disabled={busy}
                style={({ pressed }) => [styles.ocrBtn, { opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
              >
                {busy ? <ActivityIndicator color="#04130A" /> : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#04130A" />
                    <Text style={styles.ocrText}>Auto-fill with AI (GPT-4o)</Text>
                  </>
                )}
              </Pressable>
            )}
          </GlassCard>

          <GlassCard style={{ marginTop: spacing(2) }} testID="manual-form">
            <Text style={styles.title}>Or enter manually</Text>
            <Text style={styles.label}>Vendor</Text>
            <TextInput testID="manual-vendor" style={styles.input} value={vendor} onChangeText={setVendor} placeholder="Shell, AutoZone…" placeholderTextColor={colors.textMute} />
            <Text style={styles.label}>Amount (USD)</Text>
            <TextInput testID="manual-amount" style={styles.input} value={amount} onChangeText={setAmount} placeholder="42.50" keyboardType="decimal-pad" placeholderTextColor={colors.textMute} />
            <Text style={styles.label}>Date</Text>
            <TextInput testID="manual-date" style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMute} />
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {["fuel", "maintenance", "tolls", "food", "other"].map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} testID={`cat-${c}`} style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={{ color: category === c ? "#04130A" : colors.text, fontWeight: "700" }}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable testID="manual-save-button" onPress={saveManual} disabled={busy} style={[styles.ocrBtn, { backgroundColor: colors.surface, marginTop: spacing(2) }]}>
              {busy ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={[styles.ocrText, { color: colors.primary }]}>Save receipt</Text>
              )}
            </Pressable>
          </GlassCard>

          {Platform.OS === "web" && (
            <Text style={{ color: colors.textMute, ...font.small, marginTop: spacing(2), textAlign: "center" }}>
              Tip: open the app on a phone for camera capture.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), paddingBottom: spacing(6) },
  title: { color: colors.text, ...font.h2 },
  sub: { color: colors.textDim, ...font.body, marginTop: 4 },
  label: { color: colors.textDim, ...font.small, marginTop: spacing(1.5), marginBottom: 6, textTransform: "uppercase" },
  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.text, ...font.body,
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: spacing(2) },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: radii.pill, borderWidth: 1 },
  primaryAction: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryActionText: { color: "#04130A", fontWeight: "800" },
  secondaryAction: { backgroundColor: "transparent", borderColor: colors.primary },
  secondaryActionText: { color: colors.primary, fontWeight: "800" },
  ocrBtn: { marginTop: spacing(2), flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 14 },
  ocrText: { color: "#04130A", fontWeight: "800", ...font.h3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
