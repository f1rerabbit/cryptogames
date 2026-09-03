import { Page, Shell } from "@cg/ui";
import { AdminLogin } from "../admin-actions";
export default function Login() {
  return (
    <Shell admin>
      <Page eyebrow="RBAC • MFA-READY" title="Admin login">
        <p>
          Доступ только для авторизованной роли ADMIN. Операции запрещены по
          умолчанию.
        </p>
        <AdminLogin />
      </Page>
    </Shell>
  );
}
