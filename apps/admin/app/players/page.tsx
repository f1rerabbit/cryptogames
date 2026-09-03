import { Page, Shell } from "@cg/ui";
export default function Players() {
  return (
    <Shell admin>
      <Page eyebrow="PLAYER OPERATIONS" title="Игроки">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Игрок</th>
                <th>Status</th>
                <th>Asset</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>demo.player@example.invalid</td>
                <td>ACTIVE</td>
                <td>TSC</td>
                <td>
                  <a href="/players/demo">Открыть 360</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Page>
    </Shell>
  );
}
