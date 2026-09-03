"use client";
import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
async function call(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("cg_admin_token");
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
  };
  if (!response.ok) throw new Error(body.error?.message ?? "Rejected");
  return body;
}
export function AdminLogin() {
  const [m, setM] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      const x = await call("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: d.get("email"),
          password: d.get("password"),
        }),
      });
      if (x.token) localStorage.setItem("cg_admin_token", x.token);
      setM("Административная сессия активна.");
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="field">
        Admin email
        <input name="email" type="email" required />
      </label>
      <label className="field">
        Пароль
        <input name="password" type="password" minLength={12} required />
      </label>
      <button>Войти</button>
      <p role="status">{m}</p>
    </form>
  );
}
export function PlayerActions({ id }: { id: string }) {
  const [m, setM] = useState("");
  async function action(kind: string, body: object = {}) {
    try {
      await call(`/admin/players/${id}/${kind}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setM(`Команда ${kind} записана.`);
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  return (
    <section className="card">
      <h2>Финансовые и status actions</h2>
      <div className="actions">
        <button
          onClick={() =>
            action("credit", {
              amount: "1000",
              reason: "Demo support adjustment",
              ticket: "DEMO-UI",
              idempotencyKey: crypto.randomUUID(),
            })
          }
        >
          Credit 1 000 TSC
        </button>
        <button
          onClick={() =>
            action("debit", {
              amount: "100",
              reason: "Demo correction",
              ticket: "DEMO-UI",
              idempotencyKey: crypto.randomUUID(),
            })
          }
        >
          Debit 100 TSC
        </button>
        <button onClick={() => action("freeze")}>Freeze</button>
        <button onClick={() => action("unfreeze")}>Unfreeze</button>
      </div>
      <p role="status">{m}</p>
    </section>
  );
}
