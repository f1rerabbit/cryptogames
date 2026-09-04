import { Page, Shell, Stat } from "@cg/ui";
import { Faucet, LogoutButton } from "../client-actions";
export default function Wallet() {
  return (
    <Shell>
      <Page eyebrow="TSC WALLET • NON-WITHDRAWABLE" title="Тестовый кошелёк">
        <div className="stats">
          <Stat label="Актив" value="TSC" />
          <Stat label="Тип" value="TEST FUNDS" />
          <Stat label="Стоимость" value="0" />
          <Stat label="Вывод" value="Недоступен" />
        </div>
        <section className="card">
          <h2>Demo faucet</h2>
          <Faucet />
        </section>
        <LogoutButton />
      </Page>
    </Shell>
  );
}
