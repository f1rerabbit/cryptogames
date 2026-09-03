import { Page, Shell } from "@cg/ui";
import { AuthForm } from "../client-actions";
export default function Register() {
  return (
    <Shell>
      <Page eyebrow="PLAYER PROFILE" title="Регистрация">
        <p>Создаёт постоянный профиль и отдельный TSC ledger account.</p>
        <AuthForm mode="register" />
      </Page>
    </Shell>
  );
}
