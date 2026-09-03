"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/v1";
async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { credentials: "include" });
  if (response.status === 401) throw new Error("Войдите, чтобы продолжить");
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok) throw new Error(body.error?.message ?? "Ошибка API");
  return body;
}
type Game = {
  id: string;
  slug: string;
  name: string;
  category: string;
  minBet: string;
  maxBet: string;
};
export function LiveBalance() {
  const [state, setState] = useState("Загрузка…");
  useEffect(() => {
    void get<{ available: string }>("/me/wallet")
      .then((x) => setState(`${x.available} TSC`))
      .catch((e) => setState(e instanceof Error ? e.message : "Ошибка"));
  }, []);
  return <strong className="balance">{state}</strong>;
}
export function LiveGames() {
  const [games, setGames] = useState<Game[]>([]),
    [state, setState] = useState("Загрузка каталога…");
  useEffect(() => {
    void get<Game[]>("/games")
      .then((rows) => {
        setGames(rows);
        setState(rows.length ? "" : "Активных игр пока нет.");
      })
      .catch((e) => setState(e instanceof Error ? e.message : "Ошибка"));
  }, []);
  if (!games.length) return <p role="status">{state}</p>;
  return (
    <div className="game-grid">
      {games.map((game) => (
        <article className="game-card" key={game.id}>
          <div className="art" aria-hidden="true">
            <span>DEMO</span>
          </div>
          <div>
            <small>DEMO • {game.category}</small>
            <h3>{game.name}</h3>
            <p>
              Ставка {game.minBet} — {game.maxBet} TSC
            </p>
            <a href={`/games/${game.slug}`}>Открыть DEMO</a>
          </div>
        </article>
      ))}
    </div>
  );
}
export function LiveGameDetail({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [game, setGame] = useState<Game | null>(null),
    [state, setState] = useState("Загрузка…");
  useEffect(() => {
    void get<Game>(`/games/${slug}`)
      .then(setGame)
      .catch((e) => setState(e instanceof Error ? e.message : "Ошибка"));
  }, [slug]);
  if (!game) return <p role="status">{state}</p>;
  return (
    <section className="hero">
      <div>
        <h2>{game.name}</h2>
        <p>
          {game.category} · {game.minBet}—{game.maxBet} TSC
        </p>
        <p className="notice">
          Результат и выплата определяются серверным provider simulator.
        </p>
      </div>
      <aside className="card">{children}</aside>
    </section>
  );
}
