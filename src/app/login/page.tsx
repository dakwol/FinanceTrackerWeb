import { GoogleSignInButton } from "@/features/google-sign-in";
import { Card } from "@/shared/ui/Card";

import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <span className={styles.badge}>Семейный бюджет</span>
        <h1>Финансы без громоздких таблиц</h1>
        <p>
          Войдите через Google, чтобы работать с общей таблицей доходов,
          расходов и накоплений.
        </p>
        <GoogleSignInButton fullWidth />
      </Card>
    </main>
  );
}
