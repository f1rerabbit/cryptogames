import { Page, Shell } from "@cg/ui";
import { SessionHistory } from "../client-actions";
export default function Sessions() {
  return (
    <Shell>
      <Page eyebrow="ACCOUNT ACTIVITY" title="Игровые сессии">
        <div className="card">
          <h2>Серверный lifecycle</h2>
          <p>
            ACTIVE → COMPLETED или CANCELLED. Сессии и wagers доступны только
            владельцу.
          </p>
          <SessionHistory />
        </div>
      </Page>
    </Shell>
  );
}
