import { GameGrid, Page, Shell } from "@cg/ui";
export default function Games() {
  return (
    <Shell admin>
      <Page eyebrow="CONTENT OPERATIONS" title="Game catalog">
        <p>
          ADMIN может менять active, integer min/max bet и sort order через
          PATCH /v1/admin/games/:id.
        </p>
        <GameGrid />
      </Page>
    </Shell>
  );
}
