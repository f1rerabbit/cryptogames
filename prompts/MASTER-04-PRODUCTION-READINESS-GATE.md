# MASTER PROMPT 04 — Production readiness gate без Bitcoin

Этот промт запускается только после ручной приёмки первых трёх. Его задача — не добавлять функции, а провести независимый gap analysis, исправить critical/high дефекты, проверить финансовые инварианты, permissions, accessibility, migrations, backup/restore, load/failover и документацию.

Прочитай весь репозиторий и спецификацию. Составь traceability matrix requirement → implementation → test. Ничего не помечай готовым без доказательства. Реальную криптовалюту не добавляй. Финал: `docs/PRODUCTION-READINESS-REPORT.md`, исправления, полный quality gate и список внешних решений для Prompt 5.
