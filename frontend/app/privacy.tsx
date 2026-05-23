import React from "react";
import { LegalScreen } from "@/src/components/LegalText";
import { PRIVACY_POLICY } from "@/src/legal/content";

export default function PrivacyScreen() {
  return <LegalScreen title="Privacy Policy" source={PRIVACY_POLICY} testID="privacy-screen" />;
}
