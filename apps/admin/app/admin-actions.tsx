"use client";
import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
async function call<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json" },
  });
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok) throw new Error(body.error?.message ?? "Rejected");
  return body;
}
export function AdminLogin() {
  const [m, setM] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      await call("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: d.get("email"),
          password: d.get("password"),
        }),
      });
      setM("Административная HttpOnly-сессия активна.");
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)}>
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
  const [m, setM] = useState(""),
    [preview, setPreview] = useState<{
      id: string;
      payloadHash: string;
      entries: unknown[];
    } | null>(null);
  async function status(kind: string) {
    try {
      await call(`/admin/players/${id}/${kind}`, {
        method: "POST",
        body: "{}",
      });
      setM(`${kind}: success`);
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  async function prepare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      const result = await call<
        typeof preview extends null
          ? never
          : { id: string; payloadHash: string; entries: unknown[] }
      >(`/admin/players/${id}/grants/preview`, {
        method: "POST",
        body: JSON.stringify({
          amount: d.get("amount"),
          reason: d.get("reason"),
          ticket: d.get("ticket"),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setPreview(result);
      setM("Preview создан сервером. Проверьте entries и подтвердите.");
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  async function confirm() {
    if (!preview) return;
    try {
      await call(`/admin/grants/${preview.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          previewHash: preview.payloadHash,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setM("Test Funds Grant выполнен и записан в audit.");
      setPreview(null);
    } catch (e) {
      setM(e instanceof Error ? e.message : "Ошибка");
    }
  }
  return (
    <section className="card">
      <h2>Test Funds Grant</h2>
      <form onSubmit={(event) => void prepare(event)}>
        <label className="field">
          Amount TSC
          <input
            name="amount"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            required
          />
        </label>
        <label className="field">
          Reason
          <input name="reason" minLength={3} required />
        </label>
        <label className="field">
          Ticket/reference
          <input name="ticket" minLength={3} required />
        </label>
        <button>Preview balanced entries</button>
      </form>
      {preview && (
        <div>
          <pre>{JSON.stringify(preview.entries, null, 2)}</pre>
          <button onClick={() => void confirm()}>Confirm grant</button>
        </div>
      )}
      <div className="actions">
        <button onClick={() => void status("freeze")}>Freeze</button>
        <button onClick={() => void status("unfreeze")}>Unfreeze</button>
      </div>
      <p role="status">{m}</p>
    </section>
  );
}
