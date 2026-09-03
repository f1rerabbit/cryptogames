import { Page, Shell } from "@cg/ui";
import { Resource } from "../live-data";
export default function Sessions() {
  return (
    <Shell admin>
      <Page eyebrow="DEMO PROVIDER ACTIVITY" title="Game sessions">
        <Resource path="/admin/game-sessions" />
      </Page>
    </Shell>
  );
}
