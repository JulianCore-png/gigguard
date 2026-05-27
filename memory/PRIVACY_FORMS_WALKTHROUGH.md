# Privacy Forms — Click-by-Click Fill-in Guide
**App Store Connect "App Privacy"** + **Google Play Console "Data safety"**

Use this side-by-side while filling out each store. The answers below are derived directly from what Gig-Guard actually does (auditable in `/app/backend/server.py`).

---

# 🍎 Apple — App Store Connect → App Privacy

Path: App Store Connect → your app → **App Privacy** → "Get Started"

## Step 1 — Do you collect any data?
**Answer: YES**

## Step 2 — For each data type, answer 4 questions per type
For every type below, the answers are the same:
- Is this data **used to track**? → **NO**
- Is this data **linked to user's identity**? → **YES**
- **Purpose**: App Functionality

| # | Data type to add | Apple's category | Why we collect it |
|---|---|---|---|
| 1 | **Email Address** | Contact Info | Account creation, login, support correspondence |
| 2 | **Precise Location** | Location | Compute miles driven during an active shift (foreground only) |
| 3 | **Coarse Location** | Location | Same as above — Apple asks for both if you sample GPS |
| 4 | **Photos or Videos** | User Content | Receipt images for OCR auto-fill |
| 5 | **User ID** | Identifiers | Internal `users.id` (UUID), used as JWT subject |
| 6 | **Purchase History** | Purchases | Pro subscription record (Stripe customer + subscription IDs) |

**Do NOT add:**
- Payment Info (Stripe handles card data — we never see it)
- Browsing History / Search History (we don't collect)
- Crash Data / Performance Data / Other Diagnostic Data (no analytics SDK)
- Sensitive Info, Health, Fitness, Financial Info (none collected)
- Contacts, Audio Data, Customer Support text (none)

## Step 3 — Privacy practices
- "Do you or your third-party partners use this data for tracking purposes?" → **NO**
- "Privacy policy URL" → after deploy, paste `https://<your-published-domain>/privacy`

## Step 4 — Confirm
Apple shows a "Privacy Nutrition Label" preview. It should display:
> **Data Linked to You**
> Contact Info • Location • User Content • Identifiers • Purchases

Hit **Publish**.

---

# 🤖 Google — Play Console → App content → Data safety

Path: Play Console → your app → **App content** → **Data safety** → "Start"

## Page 1 — Data collection and security

- Does your app collect or share any of the required user data types? → **Yes**
- Is all of the user data collected by your app encrypted in transit? → **Yes** (HTTPS everywhere)
- Do you provide a way for users to request that their data is deleted? → **Yes**

If the deletion question is split into in-app vs. URL:
- Users can request data deletion in-app: **Yes** (Account → Privacy & my data → Delete my account)
- Web URL for deletion requests: `https://<your-published-domain>/delete-account`

## Page 2 — Data types

Click into each data type below, check "Collected", and answer the 4 follow-up questions per type. For all 6 entries the follow-up answers are:
- **Collected**: Yes
- **Shared**: **No** (we don't pass user data to any third party for their own purposes; Stripe/OpenAI are processors, which Google does NOT count as "sharing")
- **Processing**: **Processed ephemerally**: No (we persist in MongoDB) — uncheck this box
- **Required or Optional**: For Email Address & Precise Location & User IDs & Purchase History → **Required**. For Photos and Coarse Location → **Optional** (user must explicitly snap a receipt or grant location).
- **Purposes**: tick only **App functionality** and **Account management** (for email + user ID). Do NOT tick Analytics, Advertising, Personalization, Fraud prevention, etc.

| # | Category in Play Console | Specific data type to tick | Required / Optional | Purposes to tick |
|---|---|---|---|---|
| 1 | Personal info | **Email address** | Required | App functionality, Account management |
| 2 | Personal info | **User IDs** | Required | App functionality, Account management |
| 3 | Location | **Precise location** | Required | App functionality |
| 4 | Location | **Approximate location** | Required | App functionality |
| 5 | Photos and videos | **Photos** | Optional | App functionality |
| 6 | Financial info | **Purchase history** | Required | App functionality |

**Do NOT tick:**
- Any Messages, Health & fitness, Calendar, Contacts, Audio, Files, Web browsing, App activity (analytics), App info & performance (no crashlytics).
- Device or other IDs (we don't use advertising IDs).

## Page 3 — Security practices

- Is your data encrypted in transit? → **Yes** (TLS by default — backend at `https://…`)
- Do you provide a way for users to request that their data be deleted? → **Yes**
- Do you commit to follow the Google Play Families Policy? → **No** (we are 18+, not directed at children)
- Has your app been independently validated against a global security standard? → **No** (unless you have a SOC2/ISO27001 attestation — we don't)

## Page 4 — Review and submit

Google generates a preview of your Data Safety section. It should match exactly:
> **Data shared**: No data shared with third parties
> **Data collected**: Personal info (email, user IDs), Location (approximate, precise), Photos, Financial info (purchases)
> **Security practices**: Data is encrypted in transit, You can request that data be deleted

Hit **Save** → **Submit**.

---

# 🔍 Why this is honest and complete

| Claim | Backed by code |
|---|---|
| Email collected | `/api/auth/register` stores `email` field |
| User ID collected | `users.id` (UUID) used as JWT subject |
| Precise location collected | `expo-location` foreground watcher → `/api/trips/{id}/point` stores lat/lng |
| Photos collected | `expo-image-picker` → `image_base64` posted to `/api/receipts` |
| Purchase history collected | `users.stripe_subscription_id`, `users.stripe_subscription_status` |
| No tracking | No analytics SDK, no ad SDK, no third-party tracker. Confirmed in `package.json` |
| Encrypted in transit | Kubernetes ingress is HTTPS-only |
| Account deletion in-app | `DELETE /api/auth/me` (cascades trips, receipts, cancels Stripe sub) |
| Account deletion via URL | `POST /api/legal/deletion-request` exposed at `/delete-account` (no auth required) |
| Not directed at children | ToS §1 requires 18+; Privacy Policy §7 confirms |

If a reviewer asks for evidence, point them at the relevant route in the backend — everything is in one file (`/app/backend/server.py`).

---

# ⏱ Speed-run timing

- **Apple App Privacy**: ~15 min the first time.
- **Google Data Safety**: ~25 min (longer because of per-type follow-ups).
- Once filled they are saved with the app build — you only re-edit if data flows change.
