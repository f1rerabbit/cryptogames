import { Page, Shell } from "@cg/ui";
import { PlayerActions } from "../../admin-actions";
import { Resource } from "../../live-data";
export default async function Player({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell admin>
      <Page eyebrow="PLAYER 360 • LIVE API" title="Профиль игрока">
        <Resource path={`/admin/players/${id}`} />
        <PlayerActions id={id} />
      </Page>
    </Shell>
  );
}
