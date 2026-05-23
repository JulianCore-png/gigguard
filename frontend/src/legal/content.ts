// Centralised legal text for Gig-Guard. Used by /app/terms.tsx and /app/privacy.tsx
// and (optionally) hostable as static URLs for Apple App Store review.

export const COMPANY = "Julian Davis";
export const APP = "Gig-Guard";
export const CONTACT_EMAIL = "julian.davis29@outlook.com";
export const JURISDICTION = "State of Texas, USA";
export const EFFECTIVE_DATE = "February 2026";

export const TERMS_OF_SERVICE = `# ${APP} — Terms of Service

**Effective date:** ${EFFECTIVE_DATE}

Welcome to ${APP}. These Terms of Service (the "Terms") govern your use of the ${APP} mobile application and any related services (collectively, the "Service") provided by ${COMPANY} ("we", "us", "our"). By creating an account or using the Service you agree to be bound by these Terms.

## 1. Eligibility & Account
You must be at least 18 years old and able to form a binding contract to use ${APP}. You are responsible for the accuracy of your account information, the security of your credentials, and all activity under your account. Notify us immediately at ${CONTACT_EMAIL} of any unauthorized use.

## 2. What ${APP} does
${APP} helps independent gig workers (rideshare, delivery, courier, etc.) log business mileage, capture receipts, and prepare a summary for use with their tax preparer. ${APP} is a recordkeeping tool and is **not** a tax, legal, financial, or accounting service. Information provided through the Service is informational only and is not a substitute for advice from a qualified professional.

## 3. Subscriptions & Payments
${APP} offers a free tier and a paid "Pro" subscription billed at $4.99 per month through Stripe. Subscriptions renew automatically until cancelled. You may cancel at any time from the Account tab or by emailing ${CONTACT_EMAIL}; cancellation takes effect at the end of the current billing period. Except where required by law (or expressly stated in our policies), payments are non-refundable. App Store purchases (if any) are governed by Apple's terms in addition to ours.

## 4. Acceptable Use
You agree not to: (a) use the Service for any unlawful purpose; (b) reverse engineer, decompile, or interfere with the Service; (c) attempt to access another user's account; (d) upload content that infringes any third-party right; (e) use automated means to access the Service except through interfaces we expressly provide.

## 5. Your Content
Trip logs, receipt images, and any data you submit ("Your Content") remain yours. You grant us a limited, non-exclusive licence to host, store, process, and display Your Content solely to operate the Service and to perform optical character recognition (OCR) on receipt images you upload.

## 6. Third-Party Services
${APP} uses Stripe for payment processing, OpenAI (via the Emergent platform) for OCR of receipt images, and MongoDB-hosted storage. Your use of these is also subject to their own terms. We do not sell your personal data.

## 7. Termination
You may close your account at any time from the Account tab ("Delete Account") or by emailing ${CONTACT_EMAIL}. We may suspend or terminate accounts that violate these Terms or pose a risk to the Service or other users. Sections that by their nature should survive termination will survive.

## 8. Disclaimers
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM HARMFUL COMPONENTS. WE DO NOT GUARANTEE THE COMPLETENESS, ACCURACY, OR FITNESS FOR ANY PARTICULAR PURPOSE OF ANY MILEAGE, OCR-EXTRACTED, OR TAX-RELATED INFORMATION. THE IRS STANDARD MILEAGE RATE USED IN EXPORTS IS A REFERENCE FIGURE AND MAY CHANGE; YOU ARE RESPONSIBLE FOR USING THE CORRECT RATE FOR YOUR TAX FILING.

## 9. Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, ARISING OUT OF YOUR USE OF, OR INABILITY TO USE, THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM AROSE OR (B) USD $50.

## 10. Indemnification
You agree to defend, indemnify, and hold harmless ${COMPANY} from any claims, losses, or expenses (including reasonable attorneys' fees) arising out of your use of the Service or your violation of these Terms.

## 11. Changes to the Terms
We may update these Terms from time to time. Material changes will be notified in-app or by email. Continued use after the effective date of the updated Terms constitutes acceptance.

## 12. Governing Law
These Terms are governed by the laws of the ${JURISDICTION}, without regard to its conflict-of-laws principles. Any dispute will be brought exclusively in the state or federal courts located in ${JURISDICTION}, and you consent to personal jurisdiction there.

## 13. Contact
Questions about these Terms? Email **${CONTACT_EMAIL}**.
`;

export const PRIVACY_POLICY = `# ${APP} — Privacy Policy

**Effective date:** ${EFFECTIVE_DATE}

This Privacy Policy explains what information ${COMPANY} ("we") collects through the ${APP} app and how we use, share, and protect it. By using the app, you agree to this Policy.

## 1. Information we collect
We collect only what is needed to operate ${APP}:
- **Account data:** the email address and password you provide at registration. Passwords are stored only as a salted bcrypt hash; we never store or transmit your password in plain text.
- **Trip data:** for trips you actively start, we sample your device's GPS coordinates and timestamps in the foreground until you tap "End Shift". GPS sampling stops automatically when the shift ends. We do **not** continuously track your location in the background.
- **Receipt data:** images you choose to capture or upload, plus the OCR-extracted vendor, amount, date, and category fields. Original images are only retained for Pro subscribers (cloud storage); Free users can still log the parsed fields.
- **Billing data:** if you subscribe to Pro, Stripe collects your payment method directly; we receive only a Stripe customer ID, subscription status, and subscription identifier. We never see your card details.
- **Device/usage logs:** standard server logs (IP address, request path, timestamp, error codes) for security and debugging.

## 2. Sensitive permissions
- **Location (foreground only):** used solely to compute miles driven during an active shift.
- **Camera & Photo Library:** used solely to capture or pick receipt images that you choose to add.

You can revoke these at any time in your device settings; the rest of the app continues to work.

## 3. How we use your information
We use your data to: (a) provide and improve the Service; (b) calculate mileage and produce tax-ready exports; (c) auto-fill receipt fields using OCR; (d) bill Pro subscribers and manage subscriptions; (e) secure the Service and prevent abuse; (f) comply with legal obligations.

## 4. Third-party processors
- **Stripe, Inc.** — payment processing (subject to Stripe's privacy policy).
- **OpenAI (via the Emergent platform)** — receipt OCR. We send only the image you upload and receive structured fields back. Images are not used to train OpenAI's models per platform agreements at time of writing.
- **MongoDB-hosted database** — storage of account, trip, and receipt records.
- **Apple / Google** — distribution and platform-required diagnostics, subject to their privacy policies.

We do **not** sell or rent your personal information. We do not share it for cross-context behavioural advertising.

## 5. Your rights
You may, at any time, from the **Account** tab inside the app:
- **Access / export** all data we hold about you ("Download my data" — JSON).
- **Delete** your account and all associated trips and receipts ("Delete Account"). If you have an active Pro subscription, it is cancelled immediately as part of deletion.

Depending on your location, you may also have additional rights under laws such as the **California Consumer Privacy Act (CCPA)**, **EU/UK GDPR**, or similar — including the right to correction, restriction, portability, and the right to lodge a complaint with a supervisory authority. To exercise any of these, email **${CONTACT_EMAIL}**.

## 6. Data retention
We keep account, trip, and receipt data for as long as your account exists. When you delete your account the data is removed from our active databases promptly; routine backups are purged on our standard rotation (no more than 35 days). Server logs are retained up to 90 days for security purposes.

## 7. Children
${APP} is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect their information.

## 8. Security
We use industry-standard safeguards including HTTPS in transit, bcrypt password hashing, JWT-based authentication, scoped database access, and least-privilege third-party API keys. No system is perfectly secure; please use a strong, unique password.

## 9. International transfers
Your data may be processed in the United States. Where required, we rely on standard contractual clauses or equivalent mechanisms.

## 10. Changes
We will post any changes to this Policy here and update the Effective date above. Material changes will also be notified in-app or by email.

## 11. Contact
For privacy questions or to exercise any of your rights, email **${CONTACT_EMAIL}**.
`;
