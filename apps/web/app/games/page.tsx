import { GameGrid, Page, Shell } from "@cg/ui";
export default function Games() {
  return (
    <Shell>
      <Page eyebrow="ACTIVE • DEMO ONLY" title="Каталог игр">
        <p>
          Все сессии создаются сервером. Каталог показывает только активные игры
          и integer-лимиты.
        </p>
        <GameGrid />
      </Page>
    </Shell>
  );
}
