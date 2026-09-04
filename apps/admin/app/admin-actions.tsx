"use client";
import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}
async function call<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json" },
  });
  const body = (await response.json()) as T & {
    error?: { code?: string; message: string };
  };
  if (!response.ok)
    throw new Error(
      `${body.error?.code ?? response.status}: ${body.error?.message ?? "Rejected"}`,
    );
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
      <RoleManager userId={id} />
    </section>
  );
}

function refresh() {
  window.dispatchEvent(new Event("cg:admin-refresh"));
}

export function CorrectionForm() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const result = await call<{ id: string }>("/admin/ledger/corrections", {
        method: "POST",
        body: JSON.stringify({
          originalTransactionId: data.get("transactionId"),
          reason: data.get("reason"),
          ticket: data.get("ticket"),
          idempotencyKey: data.get("idempotencyKey"),
        }),
      });
      setMessage(`Compensation recorded: ${result.id}`);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <form className="card" onSubmit={(event) => void submit(event)}>
      <h2>Append-only correction</h2>
      <label className="field">
        Original transaction UUID
        <input name="transactionId" required pattern="[0-9a-fA-F-]{36}" />
      </label>
      <label className="field">
        Reason
        <input name="reason" required minLength={3} />
      </label>
      <label className="field">
        Ticket/reference
        <input name="ticket" required minLength={3} />
      </label>
      <label className="field">
        Idempotency key
        <input
          name="idempotencyKey"
          required
          minLength={8}
          defaultValue={crypto.randomUUID()}
        />
      </label>
      <button>Record compensating transaction</button>
      <p role="status">{message}</p>
    </form>
  );
}

export function ProviderSimulator() {
  const [message, setMessage] = useState(
      "Available only in APP_MODE=demo|test.",
    ),
    [gameId, setGameId] = useState("");
  async function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await call(`/admin/games/${field(data, "gameId")}/scenario`, {
        method: "POST",
        body: JSON.stringify({ scenario: data.get("scenario") }),
      });
      setGameId(field(data, "gameId"));
      setMessage("Server scenario configured.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const result = await call<{
        wager?: { status?: string; payout?: string };
      }>(`/admin/wagers/${field(data, "wagerId")}/simulate`, {
        method: "POST",
        body: "{}",
      });
      setMessage(
        `Resolved: ${result.wager?.status ?? "processed"}, payout ${result.wager?.payout ?? "0"} TSC`,
      );
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <section className="card">
      <h2>DEMO provider simulator</h2>
      <form onSubmit={(e) => void configure(e)}>
        <label className="field">
          Game UUID
          <input
            name="gameId"
            required
            pattern="[0-9a-fA-F-]{36}"
            defaultValue={gameId}
          />
        </label>
        <label className="field">
          Scenario
          <select name="scenario">
            {["LOSS", "WIN_SMALL", "WIN_LARGE", "REFUND"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button>Configure fixture</button>
      </form>
      <form onSubmit={(e) => void run(e)}>
        <label className="field">
          Eligible wager UUID
          <input name="wagerId" required pattern="[0-9a-fA-F-]{36}" />
        </label>
        <button>Run server-authoritative simulation</button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}

export function RoleManager({ userId }: { userId: string }) {
  const [message, setMessage] = useState("");
  async function change(add: boolean, role: string) {
    try {
      await call(`/admin/users/${userId}/roles${add ? "" : "/remove"}`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      setMessage(`${role} ${add ? "added" : "removed"}`);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  }
  return (
    <div className="card">
      <h3>RBAC</h3>
      <label className="field">
        Role
        <select id={`role-${userId}`} defaultValue="PLAYER">
          <option>PLAYER</option>
          <option>ADMIN</option>
          <option>FINANCE</option>
          <option>SUPPORT</option>
        </select>
      </label>
      <div className="actions">
        <button
          onClick={() =>
            void change(
              true,
              (document.getElementById(`role-${userId}`) as HTMLSelectElement)
                .value,
            )
          }
        >
          Add role
        </button>
        <button
          onClick={() =>
            void change(
              false,
              (document.getElementById(`role-${userId}`) as HTMLSelectElement)
                .value,
            )
          }
        >
          Remove role
        </button>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
