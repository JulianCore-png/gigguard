import React from "react";
import { LegalScreen } from "@/src/components/LegalText";
import { TERMS_OF_SERVICE } from "@/src/legal/content";

export default function TermsScreen() {
  return <LegalScreen title="Terms of Service" source={TERMS_OF_SERVICE} testID="terms-screen" />;
}
