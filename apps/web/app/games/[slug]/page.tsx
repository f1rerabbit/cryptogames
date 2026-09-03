import { games, Page, Shell } from "@cg/ui";
import { DemoWager } from "../../client-actions";
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = games.find((g) => g[0] === slug);
  return (
    <Shell>
      <Page
        eyebrow="SERVER-AUTHORITATIVE DEMO"
        title={game?.[1] ?? "Demo game"}
      >
        <section className="hero">
          <div>
            <p>
              Provider: CG Deterministic Simulator. Игрок не выбирает результат
              или выплату.
            </p>
            <p className="notice">
              Лимиты: {game?.[3] ?? "заданы сервером"}. Ставка резервируется
              PLAYER_AVAILABLE → GAME_ESCROW.
            </p>
          </div>
          <aside className="card">
            <h2>Demo launch</h2>
            <DemoWager slug={slug} />
          </aside>
        </section>
      </Page>
    </Shell>
  );
}
