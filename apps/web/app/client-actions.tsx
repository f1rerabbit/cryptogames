"use client";
import { FormEvent, useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
async function call(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("cg_token");
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await response.json()) as {
    token?: string;
    error?: { message: string };
    available?: string;
    amount?: string;
  };
  if (!response.ok) throw new Error(body.error?.message ?? "Запрос отклонён");
  return body;
}
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      if (mode === "register")
        await call("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
          }),
        });
      const result = await call("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      if (result.token) localStorage.setItem("cg_token", result.token);
      setMessage("Готово. Сессия защищена и сохранена в этом браузере.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="field">
        Email
        <input required type="email" name="email" autoComplete="email" />
      </label>
      <label className="field">
        Пароль
        <input
          required
          minLength={12}
          type="password"
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      <button type="submit">
        {mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
export function Faucet() {
  const [message, setMessage] = useState(
    "Фиксированная выдача: 100 000 TSC раз в 24 часа.",
  );
  const [balance, setBalance] = useState("—");
  async function refresh() {
    try {
      const wallet = await call("/me/wallet");
      setBalance(wallet.available ?? "—");
    } catch {
      setBalance("войдите для просмотра");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function claim() {
    try {
      const result = await call("/me/wallet/faucet", {
        method: "POST",
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      setMessage(`Начислено ${result.amount} TSC.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <div>
      <strong className="balance">{balance} TSC</strong>
      <button onClick={claim}>Получить 100 000 TSC</button>
      <p role="status">{message}</p>
    </div>
  );
}
export function DemoWager({ slug }: { slug: string }) {
  const [message, setMessage] = useState(
    "Результат определяет серверный DEMO-симулятор.",
  );
  async function play() {
    try {
      const session = (await call(`/games/${slug}/sessions`, {
        method: "POST",
        body: "{}",
      })) as { id?: string };
      if (!session.id) throw new Error("Сессия не создана");
      await call(`/game-sessions/${session.id}/wagers`, {
        method: "POST",
        body: JSON.stringify({
          stake: "100",
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setMessage("Ставка 100 TSC принята и перемещена в game escrow.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <div>
      <button onClick={play}>Запустить и поставить 100 TSC</button>
      <p role="status">{message}</p>
    </div>
  );
}

export function TransactionHistory() {
  const [items, setItems] = useState<
    Array<{ id: string; category: string; amount: string; timestamp: string }>
  >([]);
  const [message, setMessage] = useState("Загрузка…");
  useEffect(() => {
    void call("/me/wallet/transactions")
      .then((data) => {
        const rows =
          (
            data as {
              items?: Array<{
                id: string;
                category: string;
                amount: string;
                timestamp: string;
              }>;
            }
          ).items ?? [];
        setItems(rows);
        setMessage(rows.length ? "" : "Операций пока нет.");
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Ошибка"));
  }, []);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Категория</th>
            <th>Эффект</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.category}</td>
              <td>{item.amount} TSC</td>
              <td>{new Date(item.timestamp).toLocaleString("ru")}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={3}>{message}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function SessionHistory() {
  const [message, setMessage] = useState("Загрузка…");
  useEffect(() => {
    void call("/me/game-sessions")
      .then((data) =>
        setMessage(`${(data as unknown[]).length} сессий загружено.`),
      )
      .catch((e) => setMessage(e instanceof Error ? e.message : "Ошибка"));
  }, []);
  return <p role="status">{message}</p>;
}
