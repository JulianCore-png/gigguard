import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { ActionButton } from "@/src/components/ActionButton";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/api/auth";
import { colors, font, radii, spacing } from "@/src/theme";

type Trip = { id: string; miles: number; deduction: number; status: string; started_at: string; ended_at: string | null };
type Stats = {
  today: { miles: number; trips: number; deduction: number };
  month: { miles: number; trips: number; deduction: number };
  ytd: { miles: number; trips: number; deduction: number };
  trips_this_month: number;
  free_tier_limit: number;
  is_pro: boolean;
  irs_rate_per_mile: number;
};

export default function HomeTab() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [lastTrip, setLastTrip] = useState<Trip | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([api.get("/stats"), api.get("/trips/active")]);
      setStats(s as Stats);
      setActiveTrip(a as Trip | null);
    } catch (e: any) {
      console.warn("loadAll", e?.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // Timer
  useEffect(() => {
    if (!activeTrip) {
      setElapsed(0);
      return;
    }
    const start = new Date(activeTrip.started_at).getTime();
    const id = setInterval(() => setElapsed(Math.max(0, Date.now() - start)), 1000);
    return () => clearInterval(id);
  }, [activeTrip]);

  // GPS watcher when active
  useEffect(() => {
    const stop = () => {
      watcher.current?.remove();
      watcher.current = null;
    };
    if (!activeTrip) {
      stop();
      return;
    }
    if (Platform.OS === "web") return; // not available on web preview
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 30, timeInterval: 7000 },
        async (loc) => {
          try {
            const r = (await api.post(`/trips/${activeTrip.id}/point`, {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            })) as { miles: number; deduction: number };
            setActiveTrip((t) => (t ? { ...t, miles: r.miles, deduction: r.deduction } : t));
          } catch {}
        },
      );
    })();
    return stop;
  }, [activeTrip]);

  const startShift = async () => {
    setBusy(true);
    try {
      let start_point: any = undefined;
      if (Platform.OS !== "web") {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === "granted") {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            start_point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          } catch {}
        }
      }
      const trip = (await api.post("/trips/start", { start_point })) as Trip;
      setActiveTrip(trip);
      await loadAll();
    } catch (e: any) {
      Alert.alert("Cannot start shift", e?.message || "Try again");
      if (e?.status === 402) router.push("/pro");
    } finally {
      setBusy(false);
    }
  };

  const endShift = async () => {
    if (!activeTrip) return;
    setBusy(true);
    try {
      let end_point: any = undefined;
      if (Platform.OS !== "web") {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          end_point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        } catch {}
      }
      const ended = (await api.post(`/trips/${activeTrip.id}/end`, { end_point })) as Trip;
      setActiveTrip(null);
      setLastTrip(ended);
      await loadAll();
      await refresh();
    } catch (e: any) {
      Alert.alert("Cannot end shift", e?.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.hello}>Welcome back</Text>
              <Text style={styles.email} testID="home-user-email">{user?.email}</Text>
            </View>
            <View style={[styles.proBadge, { backgroundColor: user?.is_pro ? colors.primary : colors.surface }]} testID="home-pro-badge">
              <Text style={{ color: user?.is_pro ? "#04130A" : colors.textDim, fontWeight: "800", fontSize: 12 }}>
                {user?.is_pro ? "PRO" : "FREE"}
              </Text>
            </View>
          </View>

          {/* Live shift card or quick stats */}
          {activeTrip ? (
            <GlassCard testID="active-shift-card" style={{ marginTop: spacing(2) }}>
              <View style={styles.liveRow}>
                <View style={styles.livePulse} />
                <Text style={styles.liveLabel}>Shift in progress</Text>
              </View>
              <Text style={styles.bigMiles} testID="active-miles">{activeTrip.miles.toFixed(2)} mi</Text>
              <Text style={styles.deduction} testID="active-deduction">+${activeTrip.deduction.toFixed(2)} estimated deduction</Text>
              <View style={styles.subRow}>
                <Stat label="Time" value={fmt(elapsed)} />
                <Stat label="Rate" value={`$${stats?.irs_rate_per_mile?.toFixed(2) ?? "0.67"}/mi`} />
              </View>
            </GlassCard>
          ) : (
            <GlassCard testID="today-card" style={{ marginTop: spacing(2) }}>
              <Text style={styles.cardTitle}>Today</Text>
              <Text style={styles.bigMiles} testID="today-savings">${stats?.today?.deduction?.toFixed(2) ?? "0.00"}</Text>
              <Text style={styles.deduction}>saved in tax deductions</Text>
              <View style={styles.subRow}>
                <Stat label="Miles" value={(stats?.today?.miles ?? 0).toFixed(1)} testID="today-miles" />
                <Stat label="Trips" value={String(stats?.today?.trips ?? 0)} testID="today-trips" />
              </View>
            </GlassCard>
          )}

          {/* Last shift summary */}
          {lastTrip && !activeTrip && (
            <GlassCard testID="last-shift-summary" style={{ marginTop: spacing(2) }}>
              <Text style={styles.cardTitle}>Shift summary</Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryAccent}>{lastTrip.miles.toFixed(2)} mi</Text> driven · {" "}
                <Text style={styles.summaryAccent}>${lastTrip.deduction.toFixed(2)}</Text> in deductions
              </Text>
            </GlassCard>
          )}

          {/* Stats grid */}
          <View style={styles.gridRow}>
            <GlassCard style={styles.gridCard} testID="month-card">
              <Text style={styles.gridLabel}>This Month</Text>
              <Text style={styles.gridValue}>${stats?.month?.deduction?.toFixed(0) ?? "0"}</Text>
              <Text style={styles.gridSub}>
                {stats?.month?.miles?.toFixed(0) ?? 0} mi · {stats?.month?.trips ?? 0} trips
              </Text>
            </GlassCard>
            <GlassCard style={styles.gridCard} testID="ytd-card">
              <Text style={styles.gridLabel}>Year to date</Text>
              <Text style={styles.gridValue}>${stats?.ytd?.deduction?.toFixed(0) ?? "0"}</Text>
              <Text style={styles.gridSub}>{stats?.ytd?.miles?.toFixed(0) ?? 0} mi total</Text>
            </GlassCard>
          </View>

          {!stats?.is_pro && (
            <Pressable onPress={() => router.push("/pro")} testID="free-tier-banner">
              <GlassCard style={{ marginTop: spacing(2) }}>
                <Text style={styles.cardTitle}>
                  <Ionicons name="flash" size={16} color={colors.primary} /> {stats?.trips_this_month ?? 0} of{" "}
                  {stats?.free_tier_limit ?? 10} free trips used
                </Text>
                <Text style={[styles.summaryLine, { marginTop: 4 }]}>Tap to unlock unlimited trips for $4.99/mo.</Text>
              </GlassCard>
            </Pressable>
          )}

          <View style={{ height: spacing(15) }} />
        </ScrollView>

        {/* Bottom action button */}
        <View style={styles.fab} pointerEvents="box-none">
          {busy ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <ActionButton
              testID={activeTrip ? "end-shift-button" : "start-shift-button"}
              label={activeTrip ? "End Shift" : "Start Shift"}
              active={!!activeTrip}
              onPress={activeTrip ? endShift : startShift}
            />
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}

function Stat({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textDim, ...font.small, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: colors.text, ...font.h3, marginTop: 2 }} testID={testID}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(2), gap: spacing(1) },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  hello: { color: colors.textDim, ...font.small, textTransform: "uppercase", letterSpacing: 0.8 },
  email: { color: colors.text, ...font.h3, marginTop: 2 },
  proBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, shadowColor: colors.primary, shadowRadius: 8, shadowOpacity: 0.8 },
  liveLabel: { color: colors.primary, ...font.small, textTransform: "uppercase", letterSpacing: 1 },
  cardTitle: { color: colors.text, ...font.h3 },
  bigMiles: { color: colors.text, fontSize: 44, fontWeight: "800", letterSpacing: -1, marginTop: 6 },
  deduction: { color: colors.primary, ...font.body, marginTop: 4 },
  subRow: { flexDirection: "row", marginTop: spacing(2), gap: spacing(2) },
  summaryLine: { color: colors.textDim, ...font.body, marginTop: 4 },
  summaryAccent: { color: colors.primary, fontWeight: "800" },
  gridRow: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(2) },
  gridCard: { flex: 1 },
  gridLabel: { color: colors.textDim, ...font.small, textTransform: "uppercase" },
  gridValue: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 6 },
  gridSub: { color: colors.textDim, ...font.small, marginTop: 4 },
  fab: { position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center" },
});
