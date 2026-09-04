import { Page, Shell } from "@cg/ui";
import { GameManager } from "../live-data";
export default function Games() {
  return (
    <Shell admin>
      <Page eyebrow="CONTENT OPERATIONS" title="Game catalog">
        <GameManager />
      </Page>
    </Shell>
  );
}
