// Обёртка над Telegram WebApp и локальный fallback для разработки вне Telegram.

export interface Word {
  id: number;
  en: string;
  ru: string;
  kind?: string;
}

export interface State {
  ok: boolean;
  due: Word[];
  dictionary: Word[];
  stats: { total: number; due_today: number; mature_boxes: number };
}

const tg = (window as any).Telegram?.WebApp;

// dev-токен, если открыли приложение не из Telegram
const DEV_INIT_DATA =
  "auth_date=1700000000&user=%7B%22id%22%3A111%2C%22first_name%22%3A%22Dev%22%7D&hash=dev";

export function isTMA(): boolean {
  return !!tg && tg.initDataUnsafe?.user !== undefined || tg?.platform === "web_platform" && !!tg?.initData;
}

const initData: string = tg?.initData || DEV_INIT_DATA;

// API базовый URL: в проде тот же домен, что и Mini App; локально — uvicorn
const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (location.hostname === "localhost" ? "http://localhost:8000" : "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Init-Data": initData,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getState: () => request<State>("/api/state"),
  review: (word_id: number, grade: number) =>
    request("/api/review", { method: "POST", body: JSON.stringify({ word_id, grade }) }),
  addWord: (en: string, ru: string, kind = "noun") =>
    request("/api/word", { method: "POST", body: JSON.stringify({ en, ru, kind }) }),
  deleteWord: (id: number) =>
    request(`/api/word/${id}`, { method: "DELETE" }),
};

// ---------- Telegram SDK helpers ----------

export function haptic(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function applyTheme() {
  if (!tg) return;
  document.documentElement.style.setProperty("--bg", tg.themeParams?.bg_color || "#ffffff");
  document.documentElement.style.setProperty("--text", tg.themeParams?.text_color || "#17253b");
  document.documentElement.style.setProperty(
    "--accent",
    tg.themeParams?.button_text_color ? tg.colorScheme === "dark" ? "#8774e1" : "#3390ec" : "#3390ec"
  );
  tg.setHeaderColor?.("#ffffff");
  tg.setBackgroundColor?.(tg.themeParams?.bg_color || "#ffffff");
  tg.expand?.();
}

export function userName(): string {
  return tg?.initDataUnsafe?.user?.first_name || "Друг";
}

export function closeApp() {
  tg?.close?.();
}
