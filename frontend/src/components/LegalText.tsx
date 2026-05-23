import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Background } from "@/src/components/Background";
import { GlassCard } from "@/src/components/GlassCard";
import { colors, font, spacing } from "@/src/theme";

/** Very small markdown-ish renderer for our static legal docs. */
export function LegalText({ source, testID }: { source: string; testID?: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let para: string[] = [];

  const flushPara = (key: number) => {
    if (!para.length) return;
    blocks.push(
      <Paragraph key={`p-${key}`} text={para.join(" ")} />,
    );
    para = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flushPara(i);
      return;
    }
    if (line.startsWith("# ")) {
      flushPara(i);
      blocks.push(<Text key={i} style={styles.h1}>{line.slice(2)}</Text>);
    } else if (line.startsWith("## ")) {
      flushPara(i);
      blocks.push(<Text key={i} style={styles.h2}>{line.slice(3)}</Text>);
    } else if (line.startsWith("- ")) {
      flushPara(i);
      blocks.push(
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Paragraph text={line.slice(2)} style={{ flex: 1 }} />
        </View>,
      );
    } else {
      para.push(line);
    }
  });
  flushPara(lines.length);

  return (
    <ScrollView
      testID={testID}
      contentContainerStyle={{ padding: spacing(2), paddingBottom: spacing(8) }}
      showsVerticalScrollIndicator
    >
      <GlassCard>{blocks}</GlassCard>
    </ScrollView>
  );
}

/** Renders **bold** and email links inline. */
function Paragraph({ text, style }: { text: string; style?: any }) {
  // Replace markdown bold with placeholder spans.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <Text key={`b-${key++}`} style={styles.bold}>
          {tok.slice(2, -2)}
        </Text>,
      );
    } else {
      const email = tok;
      parts.push(
        <Text
          key={`e-${key++}`}
          style={styles.link}
          onPress={() => Linking.openURL(`mailto:${email}`)}
        >
          {email}
        </Text>,
      );
    }
    lastIdx = m.index + tok.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return <Text style={[styles.p, style]}>{parts}</Text>;
}

const styles = StyleSheet.create({
  h1: { color: colors.text, ...font.h1, marginBottom: 8 },
  h2: { color: colors.text, ...font.h2, marginTop: spacing(2), marginBottom: 4 },
  p: { color: colors.textDim, ...font.body, marginTop: 8, lineHeight: 22 },
  bold: { color: colors.text, fontWeight: "800" },
  link: { color: colors.primary, textDecorationLine: "underline" },
  bulletRow: { flexDirection: "row", marginTop: 6, gap: 8 },
  bulletDot: { color: colors.primary, ...font.body, lineHeight: 22 },
});

export function LegalScreen({ title, source, testID }: { title: string; source: string; testID?: string }) {
  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <LegalText source={source} testID={testID} />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingTop: spacing(1) }}>
          <Text style={{ color: colors.textMute, ...font.small }}>{title}</Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}
