import { Page, Shell, Stat } from "@cg/ui";
import { PlayerActions } from "../../admin-actions";
export default async function Player({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell admin>
      <Page eyebrow="PLAYER 360 • DEMO" title="Профиль игрока">
        <div className="stats">
          <Stat label="Status" value="ACTIVE" />
          <Stat label="Wallet" value="TSC" />
          <Stat label="Withdraw" value="Disabled" />
          <Stat label="Sessions" value="Audited" />
        </div>
        <PlayerActions id={id} />
      </Page>
    </Shell>
  );
}
