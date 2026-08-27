# MASTER PROMPT 06 — Bitcoin mainnet controlled launch

НЕ ЗАПУСКАТЬ автоматически. Требуются письменные sign-off legal/compliance/security/finance, внешний pentest, завершённая key ceremony, custody production credentials вне репозитория, DR drill и утверждённые лимиты.

Codex должен сначала проверить evidence checklist и остановиться при любом пробеле. После допуска: production adapter configuration, mainnet address validation, tiered confirmations, withdrawal maker-checker/policy engine, fee/UTXO management, reconciliation, monitoring, kill switches и минимальные launch limits. Codex не получает private keys и не проводит key ceremony. Результат не деплоится напрямую в production: только reviewed PR, staging verification и отдельное human-controlled deployment.
