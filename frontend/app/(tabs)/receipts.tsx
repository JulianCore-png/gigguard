import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { colors, font, radii, spacing } from "@/src/theme";

type Receipt = {
  id: string;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  created_at: string;
};

export default function ReceiptsTab() {
  const router = useRouter();
  const [items, setItems] = useState<Receipt[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems((await api.get("/receipts")) as Receipt[]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Receipts</Text>
            <Text style={styles.sub}>Snap a photo, we auto-fill the rest.</Text>
          </View>
          <Pressable
            testID="snap-receipt-button"
            onPress={() => router.push("/receipt-capture")}
            style={({ pressed }) => [styles.snapBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="camera" size={20} color="#04130A" />
            <Text style={styles.snapText}>Snap</Text>
          </Pressable>
        </View>
        <FlatList
          testID="receipts-list"
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
          ListEmptyComponent={
            <GlassCard>
              <Text style={{ color: colors.textDim, ...font.body }}>
                No receipts yet. Tap “Snap” to add a fuel or maintenance receipt — we’ll extract the details for you.
              </Text>
            </GlassCard>
          }
          renderItem={({ item }) => (
            <GlassCard style={{ marginBottom: spacing(1.5) }} testID={`receipt-card-${item.id}`}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendor}>{item.vendor || "Unknown vendor"}</Text>
                  <Text style={styles.meta}>
                    {item.date || new Date(item.created_at).toLocaleDateString()} ·{" "}
                    <Text style={{ color: colors.primary }}>{item.category || "other"}</Text>
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {item.amount != null ? `$${Number(item.amount).toFixed(2)}` : "—"}
                </Text>
              </View>
            </GlassCard>
          )}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing(2),
  },
  h1: { color: colors.text, ...font.h1 },
  sub: { color: colors.textDim, ...font.body, marginTop: 4 },
  snapBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: "center",
    gap: 6,
  },
  snapText: { color: "#04130A", ...font.h3, fontWeight: "800" },
  list: { padding: spacing(2), paddingBottom: spacing(10) },
  row: { flexDirection: "row", alignItems: "center" },
  vendor: { color: colors.text, ...font.h3 },
  meta: { color: colors.textDim, ...font.small, marginTop: 4 },
  amount: { color: colors.primary, fontSize: 22, fontWeight: "800" },
});
