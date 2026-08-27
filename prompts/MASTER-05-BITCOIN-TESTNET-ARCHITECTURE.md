# MASTER PROMPT 05 — Bitcoin testnet/signing architecture

НЕ ЗАПУСКАТЬ, пока заполнены вопросы `docs/OPEN_QUESTIONS.md`, утверждены лицензия, custody, KYC/AML и blockchain analytics, проведён security review Prompt 04.

Задача: сначала создать ADR и threat model, затем интегрировать только testnet/signet через watch-only deposit flow и выбранный custody adapter. Не генерировать/печатать seed в Codex, CI или приложении. Signing остаётся у утверждённого HSM/MPC/multisig provider. TSC и BTC ledgers разделены. Mainnet выключен compile/deploy-time guard. Реализовать confirmations, UTXO tracking, RBF/reorg, screening sandbox, reconciliation и testnet e2e. Любое отсутствие утверждённого внешнего решения — blocker, а не повод придумать mock production security.
