import { Page, Shell } from "@cg/ui";
import { AuthForm } from "../client-actions";
export default function Login() {
  return (
    <Shell>
      <Page eyebrow="SECURE SESSION" title="Вход игрока">
        <p>Opaque-сессия, пароль Argon2id. DEMO funds only.</p>
        <AuthForm mode="login" />
        <a href="/register">Новый аккаунт</a>
      </Page>
    </Shell>
  );
}
