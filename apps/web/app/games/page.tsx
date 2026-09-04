import { Page, Shell } from "@cg/ui";
import { LiveGames } from "../live-data";
export default function Games() {
  return (
    <Shell>
      <Page eyebrow="ACTIVE • DEMO ONLY" title="Каталог игр">
        <p>
          Каталог загружается из PostgreSQL через API; inactive игры скрыты.
        </p>
        <LiveGames />
      </Page>
    </Shell>
  );
}
