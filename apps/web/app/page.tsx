import { GameGrid, Page, Shell } from "@cg/ui";
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
              Только тестовые сценарии — никакой реальной криптовалюты.
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
            <strong className="balance">100 000 TSC</strong>
            <p>Test Satoshi Credit · вывод недоступен</p>
            <a href="/wallet">Получить тестовые средства</a>
          </div>
        </section>
        <div className="section-head">
          <div>
            <p className="eyebrow">DETERMINISTIC CATALOG</p>
            <h2>Демо-игры</h2>
          </div>
          <a href="/games">Весь каталог</a>
        </div>
        <GameGrid />
      </Page>
    </Shell>
  );
}
