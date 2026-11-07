"""HTTP API для Telegram Mini App (WebApp).

Эндпоинты работают с той же базой (db.py), что и бот.
Идентификация пользователя — initData от Telegram (опциональная HMAC-проверка).
"""

import hmac
import json
import os
from urllib.parse import parse_qsl

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db

BOT_SECRET_KEY = os.getenv("BOT_SECRET_KEY", "")  # из BotFather → /webapps → Secret Key

app = FastAPI(title="Word Cards Mini App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- initData auth ----------

def validate_init_data(init_data: str) -> dict | None:
    """Возвращает payload пользователя, если initData подписана нашим ботом.

    В dev-режиме (без BOT_SECRET_KEY) подпись не проверяется.
    """
    if not init_data:
        return None
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        user = json.loads(pairs.get("user", "{}"))
        uid = int(user.get("id", 0))
        if uid == 0:
            return None
        if not BOT_SECRET_KEY:          # dev
            return {"id": uid}
        # https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
        secret = hmac.digest(BOT_SECRET_KEY.encode(), f"WebAppData{uid}".encode(), "sha256")
        data_check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()) if k != "hash")
        calc = hmac.new(secret, data_check.encode(), "sha256").hexdigest()
        if hmac.compare_digest(calc, pairs.get("hash", "")):
            return {"id": uid}
        return None
    except Exception:
        return None


async def get_uid(request: Request) -> int:
    init_data = request.headers.get("x-init-data", "")
    payload = validate_init_data(init_data)
    if payload is None:
        raise ValueError("unauthorized")
    return payload["id"]


# ---------- models ----------

class ReviewIn(BaseModel):
    word_id: int
    grade: int          # 1..4: forgot / bad / good / great


class WordIn(BaseModel):
    en: str
    ru: str
    kind: str = "noun"


# ---------- routes ----------

@app.get("/api/state")
async def state(request: Request):
    try:
        uid = await get_uid(request)
    except ValueError:
        return {"ok": False, "error": "unauthorized"}
    await db.add_user_if_missing(uid)
    due = await db.due_words(uid)
    known = await db.known_words(uid)
    stats = await db.stats(uid)
    return {
        "ok": True,
        "due": [dict(w) for w in due],
        "dictionary": [dict(w) for w in known],
        "stats": dict(stats),
    }


@app.post("/api/review")
async def review(request: Request, body: ReviewIn):
    try:
        uid = await get_uid(request)
    except ValueError:
        return {"ok": False, "error": "unauthorized"}
    ok = body.grade >= 3                      # «помню»/«отлично» продвигают карточку
    await db.review_result(uid, body.word_id, ok, grade=body.grade)
    return {"ok": True}


@app.post("/api/word")
async def add_word(request: Request, body: WordIn):
    try:
        uid = await get_uid(request)
    except ValueError:
        return {"ok": False, "error": "unauthorized"}
    en, ru = body.en.strip().lower(), body.ru.strip()
    if not en or not ru:
        return {"ok": False, "error": "empty"}
    await db.learn_word(uid, en, ru, body.kind)
    return {"ok": True}


@app.delete("/api/word/{word_id}")
async def delete_word(request: Request, word_id: int):
    try:
        uid = await get_uid(request)
    except ValueError:
        return {"ok": False, "error": "unauthorized"}
    await db.forget_word(uid, word_id)
    return {"ok": True}
