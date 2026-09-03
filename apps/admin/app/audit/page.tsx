import { Page, Shell } from "@cg/ui";
export default function Audit() {
  return (
    <Shell admin>
      <Page eyebrow="IMMUTABLE ACTIVITY" title="Audit trail">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Outcome</th>
                <th>Correlation ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ADMIN_TEST_CREDIT</td>
                <td>SUCCESS</td>
                <td>server-generated</td>
              </tr>
              <tr>
                <td>WAGER_SETTLE</td>
                <td>SUCCESS</td>
                <td>server-generated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Page>
    </Shell>
  );
}
