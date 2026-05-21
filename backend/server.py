"""Gig-Guard FastAPI backend.

Endpoints (all under /api):
  POST   /auth/register
  POST   /auth/login
  GET    /auth/me
  POST   /trips/start
  POST   /trips/{trip_id}/point
  POST   /trips/{trip_id}/end
  GET    /trips                       (list, newest first)
  POST   /receipts                    (image_base64 -> OCR auto-fill)
  GET    /receipts
  GET    /stats                       (monthly + YTD)
  GET    /export/csv?year=&month=
  POST   /billing/create-checkout-session
  POST   /stripe/webhook
  GET    /subscription/status
  POST   /subscription/refresh        (poll Stripe for latest sub status)
"""

import asyncio
import csv
import io
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any, Optional

import jwt
import stripe
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Header, Request, status
from fastapi.responses import PlainTextResponse
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("gigguard")

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "43200"))
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
IRS_RATE_PER_MILE = float(os.environ.get("IRS_RATE_PER_MILE", "0.67"))
FREE_TIER_TRIPS = 10
PRO_PRICE_USD = 4.99

stripe.api_key = STRIPE_SECRET_KEY

# ---------- DB ----------
mongo = AsyncIOMotorClient(MONGO_URL)
db = mongo[DB_NAME]

# ---------- Auth helpers ----------
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_password(p: str, h: str) -> bool:
    try:
        return pwd_ctx.verify(p, h)
    except Exception:
        return False


def create_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> Optional[str]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return data.get("sub")
    except jwt.PyJWTError:
        return None


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_jwt(token)
    if not user_id:
        raise HTTPException(401, "Invalid or expired token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ---------- Pydantic Schemas ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: EmailStr
    is_pro: bool = False
    created_at: str


class GpsPoint(BaseModel):
    lat: float
    lng: float
    timestamp: Optional[str] = None


class StartTripIn(BaseModel):
    start_address: Optional[str] = None
    start_point: Optional[GpsPoint] = None


class EndTripIn(BaseModel):
    end_address: Optional[str] = None
    end_point: Optional[GpsPoint] = None
    miles: Optional[float] = None  # optional manual override


class ReceiptIn(BaseModel):
    image_base64: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    category: Optional[str] = None


class CheckoutOut(BaseModel):
    checkout_url: str
    session_id: str


class CheckoutIn(BaseModel):
    return_url_base: Optional[str] = None


# ---------- Helpers ----------
def haversine_miles(p1: dict, p2: dict) -> float:
    lat1, lon1 = radians(p1["lat"]), radians(p1["lng"])
    lat2, lon2 = radians(p2["lat"]), radians(p2["lng"])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 3958.8 * asin(sqrt(a))


def user_public(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "is_pro": bool(u.get("is_pro", False)),
        "created_at": u["created_at"],
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def trip_public(t: dict) -> dict:
    return {
        "id": t["id"],
        "started_at": t["started_at"],
        "ended_at": t.get("ended_at"),
        "miles": round(float(t.get("miles", 0.0)), 2),
        "deduction": round(float(t.get("miles", 0.0)) * IRS_RATE_PER_MILE, 2),
        "status": t.get("status", "active"),
        "start_address": t.get("start_address"),
        "end_address": t.get("end_address"),
        "points_count": len(t.get("points", [])),
    }


def receipt_public(r: dict) -> dict:
    return {
        "id": r["id"],
        "vendor": r.get("vendor"),
        "amount": r.get("amount"),
        "date": r.get("date"),
        "category": r.get("category"),
        "created_at": r["created_at"],
        "has_image": bool(r.get("image_base64")),
    }


async def ocr_receipt(image_base64: str) -> dict:
    """Call GPT-4o vision via emergentintegrations to extract receipt fields."""
    if not EMERGENT_LLM_KEY:
        return {}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ocr-{uuid.uuid4()}",
            system_message=(
                "You are an OCR assistant for gig-worker receipts. "
                "Extract structured data from the receipt image. "
                "Respond ONLY with a compact JSON object having keys: "
                "vendor (string), amount (number, total paid in USD), "
                "date (YYYY-MM-DD), category (one of: fuel, maintenance, food, tolls, other). "
                "If a field is unknown use null."
            ),
        ).with_model("openai", "gpt-4o")
        msg = UserMessage(
            text="Extract receipt fields and return ONLY JSON.",
            file_contents=[ImageContent(image_base64=image_base64)],
        )
        text = await chat.send_message(msg)
        import json, re

        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            return {}
        data = json.loads(m.group(0))
        return {
            "vendor": data.get("vendor"),
            "amount": data.get("amount"),
            "date": data.get("date"),
            "category": data.get("category"),
        }
    except Exception as e:
        logger.warning("OCR failed: %s", e)
        return {}


# ---------- App ----------
app = FastAPI(title="Gig-Guard API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Auth ----------
@api.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "hashed_password": hash_password(body.password),
        "is_pro": False,
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "stripe_subscription_status": None,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return TokenOut(access_token=create_jwt(user_id))


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(400, "Incorrect email or password")
    return TokenOut(access_token=create_jwt(user["id"]))


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


# ---------- Trips ----------
@api.post("/trips/start")
async def trip_start(body: StartTripIn, user: dict = Depends(get_current_user)):
    # Free tier limit: count trips this calendar month
    if not user.get("is_pro"):
        now = datetime.now(timezone.utc)
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
        count = await db.trips.count_documents(
            {"user_id": user["id"], "started_at": {"$gte": month_start}}
        )
        if count >= FREE_TIER_TRIPS:
            raise HTTPException(
                402,
                f"Free tier limit reached ({FREE_TIER_TRIPS} trips/month). Upgrade to Pro for unlimited trips.",
            )

    # End any other active trip
    await db.trips.update_many(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "abandoned", "ended_at": now_iso()}},
    )
    trip_id = str(uuid.uuid4())
    doc = {
        "id": trip_id,
        "user_id": user["id"],
        "started_at": now_iso(),
        "ended_at": None,
        "miles": 0.0,
        "status": "active",
        "start_address": body.start_address,
        "end_address": None,
        "points": [body.start_point.dict()] if body.start_point else [],
    }
    await db.trips.insert_one(doc)
    return trip_public(doc)


@api.post("/trips/{trip_id}/point")
async def trip_point(trip_id: str, p: GpsPoint, user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id, "user_id": user["id"]})
    if not trip:
        raise HTTPException(404, "Trip not found")
    if trip.get("status") != "active":
        raise HTTPException(400, "Trip is not active")
    points = trip.get("points", [])
    new_miles = trip.get("miles", 0.0)
    if points:
        new_miles += haversine_miles(points[-1], p.dict())
    points.append(p.dict())
    await db.trips.update_one(
        {"id": trip_id}, {"$set": {"points": points, "miles": new_miles}}
    )
    return {"miles": round(new_miles, 2), "deduction": round(new_miles * IRS_RATE_PER_MILE, 2)}


@api.post("/trips/{trip_id}/end")
async def trip_end(trip_id: str, body: EndTripIn, user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id, "user_id": user["id"]})
    if not trip:
        raise HTTPException(404, "Trip not found")
    update = {"status": "completed", "ended_at": now_iso()}
    if body.end_address:
        update["end_address"] = body.end_address
    if body.miles is not None:
        update["miles"] = float(body.miles)
    elif body.end_point:
        points = trip.get("points", [])
        miles = trip.get("miles", 0.0)
        if points:
            miles += haversine_miles(points[-1], body.end_point.dict())
        points.append(body.end_point.dict())
        update["points"] = points
        update["miles"] = miles
    await db.trips.update_one({"id": trip_id}, {"$set": update})
    new_trip = await db.trips.find_one({"id": trip_id})
    return trip_public(new_trip)


@api.get("/trips")
async def trips_list(user: dict = Depends(get_current_user)):
    rows = await db.trips.find({"user_id": user["id"]}).sort("started_at", -1).to_list(500)
    return [trip_public(t) for t in rows]


@api.get("/trips/active")
async def trips_active(user: dict = Depends(get_current_user)):
    t = await db.trips.find_one({"user_id": user["id"], "status": "active"})
    return trip_public(t) if t else None


# ---------- Receipts ----------
@api.post("/receipts")
async def create_receipt(body: ReceiptIn, user: dict = Depends(get_current_user)):
    vendor, amount, date_str, category = body.vendor, body.amount, body.date, body.category
    if body.image_base64 and not (vendor and amount and date_str):
        extracted = await ocr_receipt(body.image_base64)
        vendor = vendor or extracted.get("vendor")
        amount = amount if amount is not None else extracted.get("amount")
        date_str = date_str or extracted.get("date")
        category = category or extracted.get("category") or "other"

    receipt_id = str(uuid.uuid4())
    doc = {
        "id": receipt_id,
        "user_id": user["id"],
        "vendor": vendor,
        "amount": float(amount) if amount is not None else None,
        "date": date_str,
        "category": category or "other",
        "image_base64": body.image_base64 if user.get("is_pro") else None,
        "created_at": now_iso(),
    }
    await db.receipts.insert_one(doc)
    return receipt_public(doc)


@api.get("/receipts")
async def list_receipts(user: dict = Depends(get_current_user)):
    rows = await db.receipts.find(
        {"user_id": user["id"]}, {"_id": 0, "image_base64": 0}
    ).sort("created_at", -1).to_list(500)
    return [receipt_public(r) for r in rows]


@api.get("/receipts/{rid}/image")
async def receipt_image(rid: str, user: dict = Depends(get_current_user)):
    r = await db.receipts.find_one({"id": rid, "user_id": user["id"]}, {"_id": 0, "image_base64": 1})
    if not r:
        raise HTTPException(404, "Not found")
    return {"image_base64": r.get("image_base64")}


# ---------- Stats ----------
@api.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    year_start = datetime(now.year, 1, 1, tzinfo=timezone.utc).isoformat()
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
    day_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc).isoformat()

    async def sum_for(since: str) -> dict:
        cur = db.trips.find(
            {"user_id": user["id"], "started_at": {"$gte": since}, "status": "completed"},
            {"miles": 1, "_id": 0},
        )
        miles = 0.0
        count = 0
        async for t in cur:
            miles += float(t.get("miles", 0.0))
            count += 1
        return {"miles": round(miles, 2), "trips": count, "deduction": round(miles * IRS_RATE_PER_MILE, 2)}

    receipt_total = 0.0
    async for r in db.receipts.find(
        {"user_id": user["id"], "date": {"$gte": now.strftime("%Y-01-01")}},
        {"amount": 1, "_id": 0},
    ):
        if r.get("amount") is not None:
            try:
                receipt_total += float(r["amount"])
            except (TypeError, ValueError):
                pass

    ytd, month, today = await asyncio.gather(sum_for(year_start), sum_for(month_start), sum_for(day_start))
    return {
        "today": today,
        "month": month,
        "ytd": ytd,
        "receipts_ytd_total": round(receipt_total, 2),
        "free_tier_limit": FREE_TIER_TRIPS,
        "trips_this_month": month["trips"],
        "is_pro": bool(user.get("is_pro")),
        "irs_rate_per_mile": IRS_RATE_PER_MILE,
    }


# ---------- Export CSV ----------
@api.get("/export/csv")
async def export_csv(
    user: dict = Depends(get_current_user),
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    if not user.get("is_pro"):
        raise HTTPException(402, "Tax-Ready Export is a Pro feature. Upgrade to unlock.")
    q: dict = {"user_id": user["id"], "status": "completed"}
    if year:
        start = datetime(year, month or 1, 1, tzinfo=timezone.utc).isoformat()
        if month:
            end_m = month + 1
            end_y = year
            if end_m > 12:
                end_m = 1
                end_y += 1
            end = datetime(end_y, end_m, 1, tzinfo=timezone.utc).isoformat()
        else:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc).isoformat()
        q["started_at"] = {"$gte": start, "$lt": end}

    trips_rows = await db.trips.find(q).sort("started_at", 1).to_list(5000)
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Date", "Start Address", "End Address", "Miles", f"Deduction (USD @ ${IRS_RATE_PER_MILE}/mi)"])
    total_miles = 0.0
    for t in trips_rows:
        total_miles += float(t.get("miles", 0.0))
        w.writerow(
            [
                t.get("started_at", ""),
                t.get("start_address") or "",
                t.get("end_address") or "",
                round(float(t.get("miles", 0.0)), 2),
                round(float(t.get("miles", 0.0)) * IRS_RATE_PER_MILE, 2),
            ]
        )
    w.writerow([])
    w.writerow(["TOTAL", "", "", round(total_miles, 2), round(total_miles * IRS_RATE_PER_MILE, 2)])
    return PlainTextResponse(out.getvalue(), media_type="text/csv")


# ---------- Stripe ----------
async def _ensure_stripe_customer(user: dict) -> str:
    if user.get("stripe_customer_id"):
        return user["stripe_customer_id"]
    customer = stripe.Customer.create(email=user["email"], metadata={"user_id": user["id"]})
    await db.users.update_one({"id": user["id"]}, {"$set": {"stripe_customer_id": customer.id}})
    return customer.id


@api.post("/billing/create-checkout-session", response_model=CheckoutOut)
async def create_checkout(request: Request, body: Optional[CheckoutIn] = None, user: dict = Depends(get_current_user)):
    if not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY == "sk_test_emergent":
        raise HTTPException(
            503,
            "Stripe is not configured with a real test key on this deployment. Set STRIPE_SECRET_KEY in /app/backend/.env to your sk_test_... key and restart the backend.",
        )
    # Resolve a valid https:// origin for success/cancel URLs (Stripe rejects relative URLs).
    candidates = [
        body.return_url_base if body and body.return_url_base else None,
        request.headers.get("origin"),
        request.headers.get("referer"),
        os.environ.get("APP_PUBLIC_URL"),
        os.environ.get("EXPO_PACKAGER_HOSTNAME"),
    ]
    origin = ""
    for c in candidates:
        if not c:
            continue
        c = str(c).rstrip("/")
        if c.startswith("http://") or c.startswith("https://"):
            origin = c
            break
        if c and "." in c:
            origin = f"https://{c}"
            break
    if not origin:
        raise HTTPException(500, "Could not determine app public URL for Stripe return URLs. Set APP_PUBLIC_URL in /app/backend/.env.")
    try:
        customer_id = await _ensure_stripe_customer(user)
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": "Gig-Guard Pro"},
                        "recurring": {"interval": "month"},
                        "unit_amount": int(PRO_PRICE_USD * 100),
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{origin}/billing-return?status=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/billing-return?status=cancel",
            metadata={"user_id": user["id"]},
        )
        return CheckoutOut(checkout_url=session.url, session_id=session.id)
    except stripe.error.StripeError as e:
        logger.error("Stripe error: %s", e)
        raise HTTPException(500, f"Stripe error: {e.user_message or str(e)}")


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            # No secret configured; trust the JSON (dev mode only)
            import json as _json

            event = _json.loads(payload)
    except Exception as e:
        raise HTTPException(400, f"Webhook signature error: {e}")
    etype = event.get("type") if isinstance(event, dict) else event["type"]
    data = (event.get("data") or {}).get("object") if isinstance(event, dict) else event["data"]["object"]
    if etype in ("checkout.session.completed", "customer.subscription.created", "customer.subscription.updated"):
        cust = data.get("customer")
        sub_id = data.get("subscription") or data.get("id")
        status_str = data.get("status") or "active"
        is_pro = status_str in ("active", "trialing")
        if cust:
            await db.users.update_one(
                {"stripe_customer_id": cust},
                {"$set": {"is_pro": is_pro, "stripe_subscription_id": sub_id, "stripe_subscription_status": status_str}},
            )
    elif etype == "customer.subscription.deleted":
        cust = data.get("customer")
        if cust:
            await db.users.update_one(
                {"stripe_customer_id": cust},
                {"$set": {"is_pro": False, "stripe_subscription_status": "canceled"}},
            )
    return {"status": "ok"}


@api.get("/subscription/status")
async def sub_status(user: dict = Depends(get_current_user)):
    return {
        "is_pro": bool(user.get("is_pro")),
        "stripe_subscription_status": user.get("stripe_subscription_status"),
        "price_usd": PRO_PRICE_USD,
    }


@api.post("/subscription/refresh")
async def sub_refresh(user: dict = Depends(get_current_user)):
    """Poll Stripe for latest subscription state for this customer (fallback when webhook is not set up)."""
    if not user.get("stripe_customer_id"):
        return {"is_pro": False, "stripe_subscription_status": None}
    try:
        subs = stripe.Subscription.list(customer=user["stripe_customer_id"], status="all", limit=5)
        active = None
        for s in subs.data:
            if s.status in ("active", "trialing"):
                active = s
                break
        if active:
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"is_pro": True, "stripe_subscription_id": active.id, "stripe_subscription_status": active.status}},
            )
            return {"is_pro": True, "stripe_subscription_status": active.status}
        # not active
        latest_status = subs.data[0].status if subs.data else None
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"is_pro": False, "stripe_subscription_status": latest_status}},
        )
        return {"is_pro": False, "stripe_subscription_status": latest_status}
    except stripe.error.StripeError as e:
        raise HTTPException(500, f"Stripe error: {e}")


# ---------- Health ----------
@api.get("/")
async def root():
    return {"app": "Gig-Guard", "ok": True, "irs_rate_per_mile": IRS_RATE_PER_MILE}


app.include_router(api)


@app.on_event("shutdown")
async def _shutdown():
    mongo.close()
