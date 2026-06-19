import { WifiOff } from "lucide-react";

import { Card } from "@/shared/ui/Card";

import styles from "./page.module.scss";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <span className={styles.icon}>
          <WifiOff size={28} />
        </span>
        <h1>Нет подключения к интернету</h1>
        <p>
          Приложению требуется сеть для чтения и записи данных Google Sheets.
          Проверьте соединение и откройте страницу повторно.
        </p>
        <a href="/dashboard">Попробовать снова</a>
      </Card>
    </main>
  );
}

