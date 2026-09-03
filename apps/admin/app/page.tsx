import { DemoBanner, Shell } from "@cg/ui";
export default function Admin() {
  return (
    <Shell>
      <DemoBanner />
      <main>
        <p className="eyebrow">OPERATIONS</p>
        <h1>Панель администратора</h1>
        <p>
          Доступ запрещён по умолчанию. Финансовые действия выполняются только
          сервером и фиксируются в аудите.
        </p>
        <nav aria-label="Основное меню">
          <a href="#status">К статусу</a>
        </nav>
        <section id="status" className="card">
          <h2>Foundation status</h2>
          <ul>
            <li>RBAC: enabled</li>
            <li>Audit trail: append-only</li>
            <li>Asset: TSC only</li>
          </ul>
        </section>
      </main>
    </Shell>
  );
}
