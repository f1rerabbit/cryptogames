import type { ReactNode } from "react";
export function DemoBanner() {
  return (
    <div className="banner" role="status">
      DEMO • ТЕСТОВЫЕ СРЕДСТВА
    </div>
  );
}
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      {children}
      <footer>
        TSC — Test Satoshi Credit • Не имеет денежной стоимости • Вывод
        недоступен
      </footer>
    </div>
  );
}
