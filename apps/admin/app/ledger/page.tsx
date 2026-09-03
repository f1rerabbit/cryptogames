import { Page, Shell } from "@cg/ui";
import { Resource } from "../live-data";
export default function Ledger() {
  return (
    <Shell admin>
      <Page eyebrow="DOUBLE-ENTRY • APPEND-ONLY" title="Ledger transactions">
        <Resource path="/admin/ledger/transactions" />
      </Page>
    </Shell>
  );
}
