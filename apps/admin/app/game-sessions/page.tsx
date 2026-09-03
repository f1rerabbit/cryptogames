import { Page, Shell } from "@cg/ui";
export default function Sessions() {
  return (
    <Shell admin>
      <Page eyebrow="DEMO PROVIDER ACTIVITY" title="Game sessions">
        <div className="stats">
          <article className="stat">
            <span>Lifecycle</span>
            <strong>ACTIVE</strong>
          </article>
          <article className="stat">
            <span>Settlement</span>
            <strong>Deterministic</strong>
          </article>
        </div>
        <p>No player-controlled payout. Settlement endpoint is ADMIN-only.</p>
      </Page>
    </Shell>
  );
}
