# Gig-Guard — Product Requirements (MVP)

Mileage & tax-deduction tracker for gig workers. One-tap UX, glassmorphism on deep charcoal with emerald-green accents.

## Stack
- Frontend: Expo Router SDK 54 (React Native), expo-blur, expo-location, expo-image-picker, expo-web-browser
- Backend: FastAPI + MongoDB (motor)
- OCR: GPT-4o vision via Emergent LLM key (emergentintegrations)
- Payments: Stripe test mode (sk_test_emergent), `$4.99/mo` Pro subscription

## Features (MVP)
1. **Auth** — JWT email/password (`/api/auth/register|login|me`).
2. **Smart-Track Mileage** — Start/End Shift glowing FAB; foreground GPS samples appended via `/api/trips/{id}/point` and miles computed server-side (haversine). End-of-shift summary card.
3. **Rapid-Snap Receipts** — Camera or library image → base64 → `POST /api/receipts` → GPT-4o vision extracts vendor/amount/date/category.
4. **Tax-Ready Export** — `GET /api/export/csv` (Pro only) returns CSV at IRS rate $0.67/mi; shared (mobile) or downloaded (web).
5. **Freemium gating** — 10 trips/month for Free; 402 with upgrade CTA when exceeded.
6. **Stripe Pro** — `/api/billing/create-checkout-session` → hosted Checkout → `/api/stripe/webhook` (or `/api/subscription/refresh` polling fallback) marks `is_pro=true`.

## Smart business enhancement
The free-tier counter on Home doubles as a contextual paywall ("X of 10 trips used") and the end-of-shift summary previews "+$X.XX saved" — both drive conversion exactly when value is felt, lifting Pro upgrades.
