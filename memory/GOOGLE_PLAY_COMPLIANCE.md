# Gig-Guard — Google Play Store Compliance

Google Play Console submission pack for Gig-Guard. Companion to `APP_STORE_COMPLIANCE.md`
(Apple) — most of the work is the same, but Google has several store-specific requirements
that are now implemented.

## ✅ What's now built into the app

| Google Play Requirement | Status | Where |
|---|---|---|
| **In-app account deletion** (policy effective May 31, 2024) | ✅ | Account tab → Privacy & my data → Delete my account |
| **Web URL for deletion requests (no sign-in)** (same policy) | ✅ | `/delete-account` — public page with email-based request form. Also linked from the Sign-in screen ("Can't sign in? Request account deletion"). |
| **Privacy Policy** | ✅ | In-app `/privacy` + must be hosted as a public URL after Publish |
| **Self-service subscription management** | ✅ | Account → Manage subscription opens the Stripe Customer Portal |
| **Auto-renew disclosure before purchase** | ✅ | Pro upgrade screen states monthly $4.99 USD, auto-renewal, cancellation behavior, and explicitly notes payment is via Stripe (not Google Play Billing) |
| **Target API level (Android 14, API 34+ required)** | ✅ | Expo SDK 54 targets API 35 |
| **Sensitive permissions justification** | ✅ | App.json declares ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, CAMERA, READ_MEDIA_IMAGES with usage strings |
| **No background location** | ✅ | Foreground-only; explicitly stated in Privacy Policy §2 |

## ✅ New backend endpoints (Google Play uses these)

| Endpoint | Description |
|---|---|
| `POST /api/legal/deletion-request` | Public, unauthenticated. Logs deletion request for manual review (Google Play policy) |
| `POST /api/billing/portal` | Returns a Stripe billing portal one-time URL so users can cancel/update without contacting support |

---

## 📋 What you fill in Google Play Console

### 1. App content → Data safety (Google's "nutrition label")

Declare these data types as **Collected** + **Shared** = No + **Used for app functionality**:

| Data type | Category | Required? | Why |
|---|---|---|---|
| Email address | Personal info | Yes | Account creation, login, support |
| User IDs | Personal info | Yes | JWT subject, links your account to your data |
| App interactions | App activity | Optional | Standard server logs |
| Approximate location | Location | Yes | Used during shifts to compute miles |
| Precise location | Location | Yes | Used during shifts to compute miles |
| Photos | Photos and videos | Yes | Receipt images uploaded by user |
| Purchase history | Financial info | Yes | Pro subscription record (we don't store card data — Stripe does) |

Security practices to declare:
- ✅ Data is encrypted in transit
- ✅ Users can request data deletion (in-app + web URL)
- ❌ Data is **not** encrypted at rest by our backend (MongoDB-managed by host; if you want this checkbox, document the host's encryption)

### 2. App content → Government apps
- Not applicable.

### 3. App content → Target audience and content
- Target age groups: **18+** (gig workers).
- App appeals to children? **No**.

### 4. App content → News apps
- **No** (not a news app).

### 5. App content → COVID-19 contact tracing
- **No**.

### 6. App content → Data deletion (NEW — required since May 31, 2024)

| Field | Value |
|---|---|
| Can users request deletion of their account and data from within the app? | **Yes** |
| Provide a URL where users can request account deletion | `https://<your-published-domain>/delete-account` |

This URL must be publicly accessible without sign-in — that's exactly what we built at `/delete-account`.

### 7. App content → Sensitive permissions

Declare each:

- **ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION**
  - **Use case:** Logging miles driven during an active gig-work shift for tax-deduction calculation
  - **Frequency:** Foreground only, while user has tapped "Start Shift"
  - **Will not be used to advertise:** confirmed
- **CAMERA**
  - **Use case:** Capturing receipts for the OCR feature
- **READ_MEDIA_IMAGES**
  - **Use case:** Allowing the user to choose an existing receipt photo from their gallery

### 8. Store listing

Reuse the strings from `APP_STORE_SUBMISSION.md`:
- **App name:** Gig-Guard (30 chars)
- **Short description (80 chars):** `Auto-track gig-work miles, snap receipts, and export a tax-ready report.`
- **Full description (4000 chars):** Same as Apple description; Google allows plain text + line breaks.
- **App icon:** 512×512 PNG (no alpha)
- **Feature graphic:** 1024×500 JPG/PNG
- **Screenshots:** at least 2 phone screenshots, 16:9 or 9:16, min 320 px

### 9. Pricing & distribution → In-app products

You declared Pro as a **Stripe subscription**, NOT a Google Play Billing subscription.

⚠️ **Heads-up:** Google Play Billing policy generally requires apps that sell digital subscriptions consumed within the app to use Google Play Billing. We are explicitly using Stripe. This is a known risk:
- Some apps in the "service" category (mileage tracking, tax tools, accounting) get approved on first submission with external billing.
- If Google rejects the submission, the fastest fix is option (b) from our planning conversation: make Pro **web-only** — disable the upgrade button in the Android app, and add a `Manage subscription on web →` link instead. Apple's reader-app exception lets us do the same for iOS.

The `/pro` screen now clearly states: *"Payment is charged to your card via Stripe; this app does not use Apple In-App Purchase or Google Play Billing."* — this is the most defensible posture and matches Spotify/Netflix's app store labeling.

### 10. App access (for the reviewer)

Provide test credentials so the Google reviewer can use Pro features without paying:
```
Email:    review@gigguard.app
Password: PlayReview2026!
```
And in the "Instructions" field:
```
1. Sign in with the supplied credentials. (Pro is pre-flipped on this test account.)
2. Tap the large green "Start Shift" button on the Home tab to demo the live mileage tracker. The app asks for foreground location only — there is no background tracking.
3. Receipts tab → Snap → choose a photo to demo the GPT-4o OCR auto-fill.
4. Account tab → Manage subscription opens the Stripe Customer Portal (test mode).
5. Account → Privacy & my data demonstrates in-app account deletion and JSON data export, both required by Play Console's User Data policy.
6. The unauthenticated deletion-request URL is exposed at /delete-account on our website.
```

After deploy, create that account in production via:
```bash
curl -X POST "$EXPO_PUBLIC_BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"review@gigguard.app","password":"PlayReview2026!"}'
# Then in MongoDB set is_pro=true so the reviewer doesn't have to pay.
```

---

## Quick verification (already tested ✅)

```bash
# Unauthenticated deletion request works:
curl -X POST "$EXPO_PUBLIC_BACKEND_URL/api/legal/deletion-request" \
  -H "Content-Type: application/json" \
  -d '{"email":"someone@test.com","reason":"can not log in"}'
# → 200 OK with friendly message

# Billing portal works once user has a Stripe customer:
curl -X POST "$EXPO_PUBLIC_BACKEND_URL/api/billing/portal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"return_url_base":"https://your-domain"}'
# → 200 OK with billing.stripe.com URL
```
