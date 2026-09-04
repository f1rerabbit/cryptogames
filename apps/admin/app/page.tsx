import { Page, Shell } from "@cg/ui";
import { Dashboard } from "./live-data";
export default function Admin() {
  return (
    <Shell admin>
      <Page eyebrow="OPERATIONS • CONTROL PLANE" title="Demo operations">
        <p>Live metrics derived by the backend from PostgreSQL and ledger.</p>
        <Dashboard />
      </Page>
    </Shell>
  );
}
