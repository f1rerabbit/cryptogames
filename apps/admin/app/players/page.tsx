import { Page, Shell } from "@cg/ui";
import { Resource } from "../live-data";
export default function Players() {
  return (
    <Shell admin>
      <Page eyebrow="PLAYER OPERATIONS" title="Игроки">
        <Resource path="/admin/players" linkKey="id" />
      </Page>
    </Shell>
  );
}
