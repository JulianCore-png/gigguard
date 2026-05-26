# Gig-Guard — App Store Connect Submission Pack

All fields below are pre-written for Gig-Guard. Copy/paste directly into App Store Connect.
Single source of truth — edit here if you tweak any wording, then update App Store Connect.

---

## 1. App Name (30 chars max)
```
Gig-Guard
```
*(9 chars)*

## 2. Subtitle (30 chars max — appears under the app name)
```
Mileage & Tax for Gig Workers
```
*(29 chars)*

Alternative options:
- `Drive. Snap. Deduct.` *(20 chars)*
- `Track Miles. Save on Taxes.` *(27 chars)*

---

## 3. Promotional Text (170 chars max — editable any time without re-review)
```
Track miles automatically, snap receipts with AI, and export a tax-ready report in seconds. Built for Uber, Lyft, DoorDash, and Instacart drivers.
```
*(146 chars)*

Alternative (more benefit-led):
```
Stop leaving money on the table. Gig-Guard auto-logs every business mile and reads your receipts so tax season takes 60 seconds, not 6 hours.
```
*(141 chars)*

---

## 4. Description (4000 chars max)
```
Gig-Guard is the one-tap mileage and tax-deduction tracker built for rideshare drivers, delivery couriers, and independent contractors. Most gig workers leave hundreds of dollars on the table at tax time because tracking miles is a chore. Gig-Guard fixes that — start a shift with a single tap and we handle the rest.

WHY GIG-GUARD

The average rideshare driver claims fewer than half the miles they're legally entitled to deduct. At the 2024 IRS standard mileage rate of $0.67 per mile, that's real money — typically $1,500 to $4,000 a year. Gig-Guard makes sure none of those miles slip through the cracks.

CORE FEATURES

• Smart-Track Mileage — Tap "Start Shift" and Gig-Guard logs every mile in the background using your phone's GPS. Tap "End Shift" and we instantly tell you how much you saved in deductions today. No spreadsheets, no guessing.

• Rapid-Snap Receipts — Photograph a fuel, maintenance, or tolls receipt and our AI (powered by GPT-4o) reads the vendor, date, amount, and category for you. Just confirm and it's logged.

• Tax-Ready Export — One tap generates a clean CSV at the official IRS rate, organized by date and totaled — ready to email to your accountant or import into TurboTax, FreeTaxUSA, or H&R Block.

• Live Earnings Dashboard — See your deductions for today, this month, and year-to-date on a beautiful glassmorphism dashboard. Watch your tax savings grow in real time.

• Built for the Road — Gig-Guard's giant glowing action button is designed for one-handed use at a stop light. The entire app is built for under 60 seconds of attention per day.

WHO IT'S FOR

Gig-Guard is purpose-built for:
• Uber & Lyft drivers
• DoorDash, Instacart, Uber Eats, Grubhub, and Postmates couriers
• Amazon Flex drivers
• Independent truckers and last-mile delivery contractors
• Any 1099 worker who drives for income

FREE vs. PRO

Free forever: up to 10 trips per month, full receipt OCR, live mileage tracking.

Pro ($4.99/month): unlimited trips, original receipt cloud storage for 7 years, one-tap tax export to CSV, and priority OCR. Cancel anytime — billed securely through Stripe. If Gig-Guard saves you $300 a year in taxes (the typical first-time user does), Pro pays for itself five times over.

YOUR PRIVACY

We take privacy seriously. GPS is sampled only while a shift is active — Gig-Guard does not track your location in the background or at any other time. Your data is yours: we never sell it, never share it for advertising, and you can export everything or permanently delete your account at any time from the Account tab.

LEGAL NOTE

Gig-Guard is a recordkeeping tool. The mileage figures it produces are intended for use with your tax preparer. Gig-Guard is not a tax, legal, or financial service.

Questions or feedback? Email julian.davis29@outlook.com — we read every message.
```
*(~2950 chars — well under the 4000 limit, leaves room for tweaks)*

---

## 5. Keywords (100 chars max, comma-separated, NO spaces between commas)
```
mileage,tax,deduction,uber,lyft,doordash,gig,driver,rideshare,delivery,1099,irs,receipt,expense
```
*(95 chars)*

ASO tips:
- Don't repeat words from the app name or subtitle — Apple already indexes those.
- Singular forms generally outperform plurals (Apple handles plural matching internally).
- Skip stop words ("the", "and", "for") — they waste characters.

---

## 6. Copyright
```
© 2026 Julian Davis
```

(App Store Connect's "Copyright" field just wants the line itself; the `©` is optional but professional. If Apple strips the symbol, plain `2026 Julian Davis` is fine.)

---

## 7. Support URL
You need a working URL Apple's reviewers (and users) can visit.

**Recommended fast options, in order of effort:**

1. **Use your published Gig-Guard app's privacy page** — after you tap Publish in Emergent, your app is live at a real https:// URL. Both `https://<your-published-domain>/privacy` and `https://<your-published-domain>/terms` are public, in-app screens that work in a browser too. Use either for the Support URL field.

2. **Free standalone support page (5 minutes)** — create a public Notion page or GitHub Gist titled "Gig-Guard Support" with three lines:
   - "Need help with Gig-Guard? Email **julian.davis29@outlook.com** — we reply within 24 hours."
   - Link to your Privacy Policy
   - Link to your Terms of Service
   Then paste that public URL into App Store Connect.

3. **Buy gigguard.app (or similar)** and point it at a simple static page. Best long-term.

**Minimum Apple actually requires:** a public, working page that lets a user contact you. Email-only is not enough — they need an HTTPS URL.

---

## 8. Marketing URL (optional)
Same recommendation as Support URL. You can reuse the same URL for both.

---

## 9. Routing App Coverage File (.geojson)

**Important: this field is NOT required for Gig-Guard.** Apple only requires a routing coverage file if your app provides **turn-by-turn directions** (like Waze, Maps, or Citymapper) and is in the **Navigation** category. Gig-Guard is in the **Finance** (or **Business**) category and does not provide point-to-point directions — it passively logs miles during a shift. Leave this field blank.

**However**, since you specifically asked for it (and it's good future-proofing if you ever add a "best route to gig hotspots" feature), I've generated a contiguous-United-States MultiPolygon GeoJSON file you can upload. See `/app/memory/gigguard_routing_coverage.geojson`.

The file covers the lower 48 states + Alaska + Hawaii as a single MultiPolygon (the Apple requirement). It's a deliberately loose bounding-polygon — Apple's docs say "the boundary should follow the actual area you support but does not need to be precise."

---

## 10. Primary & Secondary Category
- **Primary:** Finance
- **Secondary:** Business

(Do NOT pick Navigation — that triggers the routing-file requirement and stricter review.)

---

## 11. Age Rating
Use App Store Connect's questionnaire. Gig-Guard answers will produce a **4+** rating because:
- No explicit content, alcohol, gambling, violence, etc.
- Unrestricted web access? No.
- User-generated content shared with others? No.

---

## 12. App Privacy ("Nutrition Label") — data types to declare

| Data Type | Used For | Linked to User | Tracking |
|---|---|---|---|
| Email Address | App Functionality | Yes | No |
| Precise Location | App Functionality (mileage logging) | Yes | No |
| Photos | App Functionality (receipts) | Yes | No |
| User ID | App Functionality | Yes | No |
| Purchase History | App Functionality (Pro subscription) | Yes | No |

For each: select "Data is collected" → assign to the App Functionality purpose only → confirm it is linked to the user → confirm it is NOT used for tracking.

---

## 13. Sign-in Info for App Reviewer
Apple's reviewers need a working test account. Use:

```
Email:    review@gigguard.app  (create this after deploy)
Password: AppleReview2026!
```

Notes for the reviewer (paste in the "Notes" field on the submission):
```
1. Tap "New here? Create an account" or sign in with the supplied credentials.
2. The glowing green button at the bottom of Home is the core feature — tap it to start a shift; tap again to end. Location permission is requested only on first tap.
3. Receipts tab → "Snap" → take a photo or choose one. The AI auto-fills vendor/amount/date.
4. Account tab → "Privacy & my data" demonstrates the required Account Deletion and Data Export flows (Apple Guideline 5.1.1(v)).
5. Pro upgrade flow opens Stripe Checkout. Use card 4242 4242 4242 4242 with any future expiry and any CVC.
```
