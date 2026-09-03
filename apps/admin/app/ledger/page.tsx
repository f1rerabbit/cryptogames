import { Page, Shell } from "@cg/ui";
export default function Ledger() {
  return (
    <Shell admin>
      <Page eyebrow="DOUBLE-ENTRY • APPEND-ONLY" title="Ledger transactions">
        <p className="notice">
          Баланс вычисляется из проводок. Редактирование и удаление запрещены DB
          triggers.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Asset</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>FAUCET</td>
                <td>TEST_FAUCET</td>
                <td>PLAYER_AVAILABLE</td>
                <td>TSC</td>
              </tr>
              <tr>
                <td>GAME_WAGER</td>
                <td>PLAYER_AVAILABLE</td>
                <td>GAME_ESCROW</td>
                <td>TSC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Page>
    </Shell>
  );
}
