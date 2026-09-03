"use client";
import { useCallback, useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json" },
  });
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Admin authentication required"
        : (body.error?.message ?? "API error"),
    );
  return body;
}
export function Resource({
  path,
  linkKey,
}: {
  path: string;
  linkKey?: string;
}) {
  const [rows, setRows] = useState<unknown[]>([]),
    [state, setState] = useState("Загрузка…");
  useEffect(() => {
    void api<unknown[] | Record<string, unknown>>(path)
      .then((value) => {
        const list = Array.isArray(value) ? value : [value];
        setRows(list);
        setState(list.length ? "" : "Нет данных");
      })
      .catch((e) => setState(e instanceof Error ? e.message : "Ошибка"));
  }, [path]);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Live API data</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const item = row as Record<string, unknown>;
            return (
              <tr key={typeof item.id === "string" ? item.id : index}>
                <td>
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </td>
                <td>
                  {linkKey && item[linkKey] ? (
                    <a
                      href={`/players/${typeof item[linkKey] === "string" ? item[linkKey] : ""}`}
                    >
                      Открыть
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan={2}>{state}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Dashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null),
    [state, setState] = useState("Загрузка…");
  useEffect(() => {
    void api<Record<string, unknown>>("/admin/dashboard")
      .then(setData)
      .catch((e) => setState(e instanceof Error ? e.message : "Ошибка"));
  }, []);
  return (
    <section className="card">
      <h2>Database / ledger metrics</h2>
      <pre>{data ? JSON.stringify(data, null, 2) : state}</pre>
    </section>
  );
}
export function GameManager() {
  const [games, setGames] = useState<
      Array<{
        id: string;
        name: string;
        active: boolean;
        minBet: string;
        maxBet: string;
        sortOrder: number;
      }>
    >([]),
    [state, setState] = useState("Загрузка…");
  const load = useCallback(
    () =>
      api<typeof games>("/admin/games")
        .then(setGames)
        .catch((e) => setState(e instanceof Error ? e.message : "Ошибка")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function toggle(id: string, active: boolean) {
    await api(`/admin/games/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
    await load();
  }
  return (
    <div>
      {games.map((game) => (
        <article className="card" key={game.id}>
          <h2>{game.name}</h2>
          <p>
            {game.minBet}—{game.maxBet} TSC · order {game.sortOrder}
          </p>
          <button onClick={() => void toggle(game.id, !game.active)}>
            {game.active ? "Деактивировать" : "Активировать"}
          </button>
        </article>
      ))}
      {!games.length && <p>{state}</p>}
    </div>
  );
}
