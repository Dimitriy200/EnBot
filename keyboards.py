from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)

import os

MINI_APP_URL = os.getenv("MINI_APP_URL", "https://example.com/word-cards/")


def session_kb() -> InlineKeyboardMarkup:
    """Меню выбора режима занятия."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📱 Карточки (Mini App)", web_app=WebAppInfo(url=MINI_APP_URL)),
            ],
            [
                InlineKeyboardButton(text="🃏 Карточки (чат)", callback_data="session:cards"),
                InlineKeyboardButton(text="💬 Диалог", callback_data="session:dialog"),
            ],
            [InlineKeyboardButton(text="➕ Добавить слово в словарь", callback_data="session:add_word")],
        ]
    )


def stop_kb() -> InlineKeyboardMarkup:
    """Кнопка выхода из активной сессии."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⏹ Завершить", callback_data="session:stop")]
        ]
    )