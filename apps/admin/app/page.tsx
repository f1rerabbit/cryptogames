import { Page, Shell, Stat } from "@cg/ui";
export default function Admin() {
  return (
    <Shell admin>
      <Page eyebrow="OPERATIONS • CONTROL PLANE" title="Demo operations">
        <p>
          RBAC deny-by-default. Все финансовые команды идемпотентны и оставляют
          append-only audit trail.
        </p>
        <div className="stats">
          <Stat label="Игроки" value="1 demo" />
          <Stat label="Активные" value="1" />
          <Stat label="Заморожено" value="0" />
          <Stat label="Актив" value="TSC only" />
        </div>
        <section className="hero-panel">
          <h2>Контроль платформы</h2>
          <div className="actions">
            <a href="/players">Player 360</a>
            <a href="/ledger">Ledger activity</a>
            <a href="/audit">Audit events</a>
            <a href="/game-sessions">Game sessions</a>
          </div>
        </section>
      </Page>
    </Shell>
  );
}
