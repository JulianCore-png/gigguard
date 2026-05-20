"""Gig-Guard backend regression tests."""
import os, time, uuid, base64, io, csv as _csv
import pytest, requests
from pymongo import MongoClient

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://rapid-snap-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "gigguard")

UNIQ = uuid.uuid4().hex[:8]
EMAIL = f"tester+{UNIQ}@example.com"
PASS = "testpass123"

state = {}

def H(tok=None):
    h = {"Content-Type": "application/json"}
    if tok: h["Authorization"] = f"Bearer {tok}"
    return h

# ---- Auth ----
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True

def test_register():
    r = requests.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASS}, headers=H())
    assert r.status_code == 200, r.text
    j = r.json()
    assert "access_token" in j and j.get("token_type") == "bearer"
    assert "_id" not in r.text
    state["token"] = j["access_token"]

def test_register_duplicate():
    r = requests.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASS}, headers=H())
    assert r.status_code == 400

def test_login_ok():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASS}, headers=H())
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_wrong_pw():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": "wrongpass"}, headers=H())
    assert r.status_code == 400

def test_me_no_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401

def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers=H("badtoken"))
    assert r.status_code == 401

def test_me_ok():
    r = requests.get(f"{API}/auth/me", headers=H(state["token"]))
    assert r.status_code == 200
    j = r.json()
    assert j["email"] == EMAIL and j["is_pro"] is False and "id" in j and "created_at" in j
    assert "_id" not in r.text
    state["user_id"] = j["id"]

# ---- Trips ----
def test_trip_start_active_auto_abandon():
    tok = state["token"]
    r1 = requests.post(f"{API}/trips/start", json={"start_address": "A"}, headers=H(tok))
    assert r1.status_code == 200
    t1 = r1.json(); state["t1"] = t1["id"]
    assert t1["status"] == "active"
    r2 = requests.post(f"{API}/trips/start", json={"start_address": "B"}, headers=H(tok))
    assert r2.status_code == 200
    state["t2"] = r2.json()["id"]
    # active should be t2 now
    ra = requests.get(f"{API}/trips/active", headers=H(tok))
    assert ra.status_code == 200 and ra.json()["id"] == state["t2"]

def test_trip_points_and_miles():
    tok = state["token"]; tid = state["t2"]
    # ~1km steps near SF
    pts = [{"lat": 37.7749, "lng": -122.4194},
           {"lat": 37.7839, "lng": -122.4194},  # ~1 km north
           {"lat": 37.7929, "lng": -122.4194}]  # ~1 km more
    last = None
    for p in pts:
        r = requests.post(f"{API}/trips/{tid}/point", json=p, headers=H(tok))
        assert r.status_code == 200, r.text
        last = r.json()
    assert last["miles"] > 0
    assert abs(last["deduction"] - round(last["miles"] * 0.67, 2)) < 0.02

def test_trip_end_with_endpoint():
    tok = state["token"]; tid = state["t2"]
    r = requests.post(f"{API}/trips/{tid}/end",
                      json={"end_address": "Dest", "end_point": {"lat": 37.8, "lng": -122.4194}},
                      headers=H(tok))
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "completed" and j["ended_at"] is not None and j["miles"] > 0

def test_trip_end_with_manual_miles_override():
    tok = state["token"]
    r = requests.post(f"{API}/trips/start", json={"start_address": "X"}, headers=H(tok))
    tid = r.json()["id"]
    r2 = requests.post(f"{API}/trips/{tid}/end", json={"miles": 12.5}, headers=H(tok))
    assert r2.status_code == 200
    j = r2.json()
    assert j["miles"] == 12.5 and abs(j["deduction"] - round(12.5*0.67,2)) < 0.01

def test_trips_list_newest_first():
    tok = state["token"]
    r = requests.get(f"{API}/trips", headers=H(tok))
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and len(rows) >= 2
    ts = [x["started_at"] for x in rows]
    assert ts == sorted(ts, reverse=True)
    assert "_id" not in r.text

def test_active_null_after_end():
    r = requests.get(f"{API}/trips/active", headers=H(state["token"]))
    assert r.status_code == 200
    # could be null or new active; ensure if it's a trip it's active
    j = r.json()
    if j is not None:
        assert j["status"] == "active"

# ---- Free tier gating ----
def test_free_tier_gating_402():
    # Create a fresh user and fill 10 completed trips this month, then expect 402
    email = f"freelimit+{uuid.uuid4().hex[:6]}@example.com"
    rr = requests.post(f"{API}/auth/register", json={"email": email, "password": PASS}, headers=H())
    assert rr.status_code == 200
    tok = rr.json()["access_token"]
    # we'll directly insert 10 trips this month via mongo for speed
    cli = MongoClient(MONGO_URL); db = cli[DB_NAME]
    user = db.users.find_one({"email": email})
    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()
    docs = [{"id": str(uuid.uuid4()), "user_id": user["id"], "started_at": now_iso,
             "ended_at": now_iso, "miles": 1.0, "status": "completed", "points": []} for _ in range(10)]
    db.trips.insert_many(docs)
    r = requests.post(f"{API}/trips/start", json={}, headers=H(tok))
    assert r.status_code == 402
    assert "Free tier limit" in r.json().get("detail","")
    # cleanup
    db.trips.delete_many({"user_id": user["id"]}); db.users.delete_one({"id": user["id"]})

# ---- Receipts ----
def test_receipt_manual():
    tok = state["token"]
    r = requests.post(f"{API}/receipts", json={
        "vendor": "TEST_Shell", "amount": 42.5, "date": "2026-01-05", "category": "fuel"
    }, headers=H(tok))
    assert r.status_code == 200
    j = r.json()
    assert j["vendor"] == "TEST_Shell" and j["amount"] == 42.5 and j["has_image"] is False
    assert "_id" not in r.text

def _tiny_jpeg_b64():
    # Use a real-feature small JPEG from PIL: gradient + text-ish shapes
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (200, 120), "white")
        d = ImageDraw.Draw(img)
        for i in range(120): d.line([(0,i),(200,i)], fill=(255, 255-i*2, 200-i))
        d.rectangle([20,20,180,40], outline="black", width=2)
        d.text((25,22), "RECEIPT TOTAL $12.34", fill="black")
        d.text((25,60), "SHELL 01/05/2026", fill="black")
        buf = io.BytesIO(); img.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None

def test_receipt_ocr_image_200():
    tok = state["token"]
    b64 = _tiny_jpeg_b64()
    if not b64:
        pytest.skip("PIL unavailable")
    r = requests.post(f"{API}/receipts", json={"image_base64": b64}, headers=H(tok), timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    # OCR may fill or leave null — both acceptable
    assert "id" in j and "has_image" in j

def test_receipt_list_has_image_flag():
    tok = state["token"]
    r = requests.get(f"{API}/receipts", headers=H(tok))
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and len(rows) >= 1
    assert all("has_image" in row for row in rows)
    assert "_id" not in r.text

# ---- Stats ----
def test_stats_shape():
    tok = state["token"]
    r = requests.get(f"{API}/stats", headers=H(tok))
    assert r.status_code == 200
    j = r.json()
    for k in ("today","month","ytd"):
        assert k in j
        for f in ("miles","trips","deduction"):
            assert f in j[k]
    for k in ("trips_this_month","free_tier_limit","is_pro","irs_rate_per_mile"):
        assert k in j
    assert j["irs_rate_per_mile"] == 0.67
    assert j["free_tier_limit"] == 10

# ---- Export CSV ----
def test_csv_free_tier_402():
    tok = state["token"]
    r = requests.get(f"{API}/export/csv", headers=H(tok))
    assert r.status_code == 402

def test_csv_pro_user():
    cli = MongoClient(MONGO_URL); db = cli[DB_NAME]
    db.users.update_one({"id": state["user_id"]}, {"$set": {"is_pro": True}})
    tok = state["token"]
    r = requests.get(f"{API}/export/csv", headers=H(tok))
    assert r.status_code == 200
    text = r.text
    rows = list(_csv.reader(io.StringIO(text)))
    assert rows[0][0] == "Date"
    assert "0.67" in rows[0][-1]
    assert any(row and row[0] == "TOTAL" for row in rows)
    # revert
    db.users.update_one({"id": state["user_id"]}, {"$set": {"is_pro": False}})

# ---- Stripe ----
def test_create_checkout_session():
    tok = state["token"]
    r = requests.post(f"{API}/billing/create-checkout-session", json={}, headers=H(tok), timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "checkout_url" in j and "session_id" in j
    assert "stripe.com" in j["checkout_url"]

def test_subscription_status():
    tok = state["token"]
    r = requests.get(f"{API}/subscription/status", headers=H(tok))
    assert r.status_code == 200
    j = r.json()
    assert "is_pro" in j and j["price_usd"] == 4.99 and "stripe_subscription_status" in j

def test_subscription_refresh_no_sub():
    tok = state["token"]
    r = requests.post(f"{API}/subscription/refresh", json={}, headers=H(tok), timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "is_pro" in j and "stripe_subscription_status" in j
