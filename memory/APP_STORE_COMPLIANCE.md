# Apple App Store Submission — Compliance Checklist

## ✅ What's now built into the app

| Requirement | Status | Where |
|---|---|---|
| **Privacy Policy** (Apple Guideline 5.1.1) | ✅ In-app screen | `/privacy` (link in Account → Privacy & my data → Privacy Policy, and on register screen) |
| **Terms of Service** | ✅ In-app screen | `/terms` (link in Account → Privacy & my data → Terms of Service, and on register screen) |
| **Account Deletion in-app** (Guideline 5.1.1(v) — required since June 30, 2022) | ✅ | Account tab → Privacy & my data → "Delete my account" (confirmed with typed "DELETE"). Cascades through trips, receipts, and cancels active Stripe subscription. |
| **Right to access / Export data** (GDPR/CCPA) | ✅ | Account tab → Privacy & my data → "Export my data" (JSON share/download) |
| **Consent at signup** | ✅ | Register screen displays "By creating an account you agree to Terms of Service and Privacy Policy" with deep links |
| **Permission usage strings** | ✅ | `app.json` ios.infoPlist: NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription |

## ✅ Backend endpoints

| Endpoint | Description |
|---|---|
| `GET /api/auth/me/export` | Returns full user data (account, trips, receipts) as JSON |
| `DELETE /api/auth/me` | Permanently deletes user + all trips + all receipts; cancels Stripe subscription; revokes JWT |

## 📋 What you still need to do in App Store Connect

1. **Privacy Policy URL** — Apple requires a public URL. After you deploy with the Publish button, use:
   `https://<your-published-domain>/privacy`
2. **Support URL** — same domain, can reuse `/privacy` or set up a `/support` page.
3. **App Privacy** ("Nutrition label") in App Store Connect — declare these data types:
   - **Contact Info** → Email Address (linked to identity, used for App Functionality)
   - **Location** → Precise Location (linked to identity, used for App Functionality — "computing miles driven during active shift")
   - **User Content** → Photos (receipts) (linked to identity, App Functionality)
   - **Identifiers** → User ID (linked to identity)
   - **Purchases** → Purchase History (linked to identity, used for App Functionality)
4. **Account deletion location** — when filling the App Privacy section, point to: Account tab → Privacy & my data → Delete my account.
5. **Subscription disclosure** — Apple wants the auto-renew disclosure in the upgrade flow. Already covered in our ToS §3; the in-app "Pro" screen also shows "$4.99/mo · cancel anytime".

## 🔧 Placeholders to update before submission

The legal docs already use **your** details:
- Entity: **Julian Davis**
- Contact: **julian.davis29@outlook.com**
- Jurisdiction: **State of Texas, USA**
- Effective date: **February 2026**

Edit them anytime in `/app/frontend/src/legal/content.ts` (single source of truth).

## 🧪 How to verify before submission

```bash
# Export
curl -s "$EXPO_PUBLIC_BACKEND_URL/api/auth/me/export" -H "Authorization: Bearer $TOKEN"
# Delete
curl -s -X DELETE "$EXPO_PUBLIC_BACKEND_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"
# After delete, token returns 401
curl -s -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_BACKEND_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"  # → 401
```

All three were tested and pass.
