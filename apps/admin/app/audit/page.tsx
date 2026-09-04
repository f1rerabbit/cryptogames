import { Page, Shell } from "@cg/ui";
import { AuditExplorer } from "../live-data";
export default function Audit() {
  return (
    <Shell admin>
      <Page eyebrow="IMMUTABLE ACTIVITY" title="Audit trail">
        <AuditExplorer />
      </Page>
    </Shell>
  );
}
