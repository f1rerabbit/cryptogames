import { DemoBanner, Shell } from "@cg/ui";
export default function Home() {
  return (
    <Shell>
      <DemoBanner />
      <main>
        <p className="eyebrow">PLAYER PLATFORM</p>
        <h1>Игровое лобби готовится</h1>
        <p>
          Безопасный фундамент демонстрационной платформы. Единственный тестовый
          актив — TSC, он не имеет денежной стоимости и не выводится.
        </p>
        <nav aria-label="Основное меню">
          <a href="#catalog">Каталог</a>
        </nav>
        <section id="catalog" className="card">
          <h2>DEMO-каталог</h2>
          <p>
            Игры появятся на следующем этапе. Сейчас доступны только проверяемые
            системные контуры.
          </p>
        </section>
      </main>
    </Shell>
  );
}
