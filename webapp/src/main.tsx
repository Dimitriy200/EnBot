import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, applyTheme, haptic, userName, Word, State } from "./telegram";
import "./styles.css";

type Tab = "cards" | "dict" | "stats";

// ================= Карточки (флеш-сессия) =================

function CardsTab({ state, reload }: { state: State; reload: () => void }) {
  const [queue] = useState<Word[]>(() => [...state.due].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const word = queue[idx];

  async function grade(g: number) {
    if (!word) return;
    haptic(g >= 3 ? "light" : "heavy");
    await api.review(word.id, g);
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  if (!word) {
    return (
      <div className="done">
        <div className="big">🎉</div>
        <p>Сессия окончена! Вернитесь к следующему повторению.</p>
        <br />
        <button className="g3" style={{ border: "none", borderRadius: 12, padding: "12px 24px", color: "#fff" }}
          onClick={() => { reload(); }}>
          Обновить
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="progress">
        <div style={{ width: `${(idx / queue.length) * 100}%` }} />
      </div>
      <div className="flashcard" onClick={() => { setFlipped(!flipped); haptic("light"); }}>
        <div className="front">{word.ru}</div>
        {flipped ? (
          <>
            <div className="back">{word.en}</div>
            <div className="hint">Оцените себя</div>
          </>
        ) : (
          <div className="hint">Нажмите, чтобы перевернуть</div>
        )}
      </div>
      {flipped && (
        <div className="grades">
          <button className="g1" onClick={() => grade(1)}>❌ Забыл</button>
          <button className="g2" onClick={() => grade(2)}>😕 Плохо</button>
          <button className="g3" onClick={() => grade(3)}>🙂 Помню</button>
          <button className="g4" onClick={() => grade(4)}>✅ Отлично</button>
        </div>
      )}
    </>
  );
}

// ================= Словарь =================

function DictTab({ state, reload }: { state: State; reload: () => void }) {
  const [en, setEn] = useState("");
  const [ru, setRu] = useState("");

  async function add() {
    if (!en.trim() || !ru.trim()) return;
    haptic("medium");
    await api.addWord(en.trim(), ru.trim());
    setEn(""); setRu("");
    reload();
  }

  async function del(id: number) {
    haptic("heavy");
    await api.deleteWord(id);
    reload();
  }

  return (
    <>
      <div className="addform">
        <input placeholder="English word" value={en} onChange={(e) => setEn(e.target.value)} />
        <input placeholder="Перевод" value={ru} onChange={(e) => setRu(e.target.value)} />
        <button onClick={add}>➕ Добавить слово</button>
      </div>
      <div className="wordlist">
        {state.dictionary.map((w) => (
          <div className="wordrow" key={w.id}>
            <div>
              <div className="en">{w.en}</div>
              <div className="ru">{w.ru}</div>
            </div>
            <button className="del" onClick={() => del(w.id)}>✕</button>
          </div>
        ))}
        {state.dictionary.length === 0 && (
          <div className="empty"><div className="big">📭</div>Словарь пуст — добавьте первое слово</div>
        )}
      </div>
    </>
  );
}

// ================= Статистика =================

function StatsTab({ state }: { state: State }) {
  return (
    <div className="statgrid">
      <div className="statcard"><div className="num">{state.stats.total}</div><div className="label">Всего слов</div></div>
      <div className="statcard"><div className="num">{state.stats.due_today}</div><div className="label">Повторить сегодня</div></div>
      <div className="statcard"><div className="num">{state.stats.mature_boxes}</div><div className="label">Активных уровней</div></div>
      <div className="statcard"><div className="num">{Math.max(state.stats.total - state.stats.due_today, 0)}</div><div className="label">Выучено ✅</div></div>
    </div>
  );
}

// ================= App =================

function App() {
  const [tab, setTab] = useState<Tab>("cards");
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      const s = await api.getState();
      if (!s.ok) throw new Error("unauthorized");
      setState(s);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => {
    applyTheme();
    reload();
  }, []);

  if (error) {
    return <div className="empty"><div className="big">⚠️</div>Ошибка: {error}<br /><br />
      Откройте приложение из Telegram-бота и убедитесь, что API запущено.</div>;
  }
  if (!state) return <div className="loading">Загрузка…</div>;

  return (
    <>
      <div className="header">
        <h1>🃏 Word Cards</h1>
        <span className="sub">Привет, {userName()}!</span>
      </div>

      {tab === "cards" && (
        state.due.length === 0 ? (
          <div className="empty"><div className="big">🎉</div>На сегодня всё повторено!<br />Загляните позже.</div>
        ) : (
          <CardsTab key={state.stats.due_today} state={state} reload={reload} />
        )
      )}
      {tab === "dict" && <DictTab state={state} reload={reload} />}
      {tab === "stats" && <StatsTab state={state} />}

      <div className="tabs">
        <button className={tab === "cards" ? "active" : ""} onClick={() => { haptic("light"); setTab("cards"); }}>
          🔁 Повторить<br />{state.stats.due_today > 0 ? `(${state.stats.due_today})` : ""}
        </button>
        <button className={tab === "dict" ? "active" : ""} onClick={() => { haptic("light"); setTab("dict"); }}>
          📖 Словарь<br />({state.stats.total})
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => { haptic("light"); setTab("stats"); }}>
          📊 Статы
        </button>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
