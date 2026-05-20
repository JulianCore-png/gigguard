import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

const NOW = new Date();
const YEARS = [NOW.getFullYear(), NOW.getFullYear() - 1, NOW.getFullYear() - 2];
const MONTHS = [
  "All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function ExportScreen() {
  const { user } = useAuth();
  const [year, setYear] = useState<number>(NOW.getFullYear());
  const [monthIdx, setMonthIdx] = useState<number>(0); // 0 = All year
  const [busy, setBusy] = useState(false);
  const [csv, setCsv] = useState<string | null>(null);

  const generate = async () => {
    if (!user?.is_pro) {
      Alert.alert("Pro required", "Tax-Ready Export is a Pro feature. Upgrade to unlock.");
      return;
    }
    setBusy(true);
    try {
      const path = monthIdx === 0 ? `/export/csv?year=${year}` : `/export/csv?year=${year}&month=${monthIdx}`;
      const data = (await api.get(path)) as string;
      setCsv(data);
    } catch (e: any) {
      Alert.alert("Export failed", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!csv) return;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gigguard-${year}${monthIdx ? `-${monthIdx}` : ""}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      await Share.share({ message: csv, title: "Gig-Guard tax export" });
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard testID="export-card">
            <Text style={styles.h2}>Tax-Ready Export</Text>
            <Text style={styles.sub}>Generates a CSV using the IRS standard mileage rate. Email it to your accountant.</Text>

            <Text style={styles.label}>Year</Text>
            <View style={styles.chips}>
              {YEARS.map((y) => (
                <Pressable key={y} testID={`year-${y}`} onPress={() => setYear(y)} style={[styles.chip, year === y && styles.chipActive]}>
                  <Text style={{ color: year === y ? "#04130A" : colors.text, fontWeight: "700" }}>{y}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Month</Text>
            <View style={styles.chips}>
              {MONTHS.map((m, i) => (
                <Pressable key={m} testID={`month-${i}`} onPress={() => setMonthIdx(i)} style={[styles.chip, monthIdx === i && styles.chipActive]}>
                  <Text style={{ color: monthIdx === i ? "#04130A" : colors.text, fontWeight: "700" }}>{m}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              testID="generate-export-button"
              onPress={generate}
              disabled={busy}
              style={({ pressed }) => [styles.cta, { opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
            >
              {busy ? <ActivityIndicator color="#04130A" /> : (
                <>
                  <Ionicons name="document-text" size={18} color="#04130A" />
                  <Text style={styles.ctaText}>{user?.is_pro ? "Generate CSV" : "Upgrade to Pro to Export"}</Text>
                </>
              )}
            </Pressable>
          </GlassCard>

          {csv && (
            <GlassCard testID="export-preview" style={{ marginTop: spacing(2) }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.h3}>Preview</Text>
                <Pressable testID="export-share-button" onPress={share} style={styles.shareBtn}>
                  <Ionicons name="share" size={16} color="#04130A" />
                  <Text style={{ color: "#04130A", fontWeight: "800" }}>{Platform.OS === "web" ? "Download" : "Share"}</Text>
                </Pressable>
              </View>
              <Text style={styles.csv}>{csv.slice(0, 1200)}{csv.length > 1200 ? "\n…" : ""}</Text>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2) },
  h2: { color: colors.text, ...font.h2 },
  h3: { color: colors.text, ...font.h3 },
  sub: { color: colors.textDim, ...font.body, marginTop: 4 },
  label: { color: colors.textDim, ...font.small, marginTop: spacing(2), marginBottom: 6, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cta: {
    marginTop: spacing(3), backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  ctaText: { color: "#04130A", ...font.h3, fontWeight: "800" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  csv: { color: colors.textDim, ...font.small, marginTop: spacing(1), fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});
