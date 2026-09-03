import { Page, Shell } from "@cg/ui";
import { Resource } from "../live-data";
export default function Audit() {
  return (
    <Shell admin>
      <Page eyebrow="IMMUTABLE ACTIVITY" title="Audit trail">
        <Resource path="/admin/audit" />
      </Page>
    </Shell>
  );
}
