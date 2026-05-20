import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { api } from "@/src/api/client";
import { colors, font, spacing } from "@/src/theme";

type Trip = {
  id: string;
  started_at: string;
  ended_at: string | null;
  miles: number;
  deduction: number;
  status: string;
  start_address?: string | null;
  end_address?: string | null;
};

export default function TripsTab() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setTrips((await api.get("/trips")) as Trip[]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.h1}>Trips</Text>
          <Text style={styles.sub}>All your shifts, sorted by most recent.</Text>
        </View>
        <FlatList
          testID="trips-list"
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
          ListEmptyComponent={
            <GlassCard>
              <Text style={{ color: colors.textDim, ...font.body }}>
                No trips yet. Tap “Start Shift” on the Home tab to log your first one.
              </Text>
            </GlassCard>
          }
          renderItem={({ item }) => {
            const d = new Date(item.started_at);
            return (
              <GlassCard style={{ marginBottom: spacing(1.5) }} testID={`trip-card-${item.id}`}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.date}>
                      {d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    <Text style={styles.time}>
                      {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                      <Text style={{ color: item.status === "active" ? colors.primary : colors.textDim }}>{item.status}</Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.miles}>{item.miles.toFixed(2)} mi</Text>
                    <Text style={styles.ded}>+${item.deduction.toFixed(2)}</Text>
                  </View>
                </View>
              </GlassCard>
            );
          }}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing(2), paddingTop: spacing(2), paddingBottom: spacing(1) },
  h1: { color: colors.text, ...font.h1 },
  sub: { color: colors.textDim, ...font.body, marginTop: 4 },
  list: { padding: spacing(2), paddingBottom: spacing(10) },
  row: { flexDirection: "row", alignItems: "center" },
  date: { color: colors.text, ...font.h3 },
  time: { color: colors.textDim, ...font.small, marginTop: 4 },
  miles: { color: colors.text, ...font.h3 },
  ded: { color: colors.primary, ...font.body, marginTop: 2, fontWeight: "700" },
});
