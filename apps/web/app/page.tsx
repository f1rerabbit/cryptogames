import { Page, Shell } from "@cg/ui";
import { LiveBalance, LiveGames } from "./live-data";
export default function Home() {
  return (
    <Shell>
      <Page
        eyebrow="PLAYER PLATFORM • DEMO"
        title="Играй без риска. Проверяй каждый ход."
      >
        <section className="hero">
          <div>
            <p>
              Демонстрационное игровое лобби с серверным учётом каждого TSC.
            </p>
            <div className="actions">
              <a className="primary" href="/games">
                Смотреть игры
              </a>
              <a href="/wallet">Мой TSC кошелёк</a>
            </div>
          </div>
          <div className="hero-panel">
            <small>ДОСТУПНО</small>
            <LiveBalance />
            <p>Test Satoshi Credit · вывод недоступен</p>
          </div>
        </section>
        <h2>Демо-игры</h2>
        <LiveGames />
      </Page>
    </Shell>
  );
}
