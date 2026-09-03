import { Page, Shell } from "@cg/ui";
import { TransactionHistory } from "../client-actions";
export default function Transactions() {
  return (
    <Shell>
      <Page eyebrow="APPEND-ONLY LEDGER" title="История операций">
        <p className="notice">
          Каждая строка загружается из авторитетной сбалансированной
          double-entry проводки. Суммы — целые единицы TSC.
        </p>
        <TransactionHistory />
      </Page>
    </Shell>
  );
}
