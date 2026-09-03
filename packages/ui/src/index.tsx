import type { ReactNode } from "react";
export function DemoBanner() {
  return (
    <div className="banner" role="status">
      DEMO • ТЕСТОВЫЕ СРЕДСТВА • NO REAL VALUE
    </div>
  );
}
export function Shell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  return (
    <div className="shell">
      <DemoBanner />
      <header className="topbar">
        <a className="brand" href="/">
          CRYPT<span>OGAMES</span>
        </a>
        <nav aria-label="Основное меню">
          {admin ? (
            <>
              <a href="/players">Игроки</a>
              <a href="/ledger">Ledger</a>
              <a href="/audit">Аудит</a>
              <a href="/games">Игры</a>
            </>
          ) : (
            <>
              <a href="/games">Игры</a>
              <a href="/wallet">Кошелёк</a>
              <a href="/transactions">История</a>
              <a href="/sessions">Сессии</a>
            </>
          )}
        </nav>
        <a className="account" href="/login">
          {admin ? "Admin access" : "Профиль"}
        </a>
      </header>
      {children}
      <footer>
        <strong>TSC — Test Satoshi Credit</strong> • не имеет денежной стоимости
        • вывод недоступен
      </footer>
    </div>
  );
}
export function Page({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
