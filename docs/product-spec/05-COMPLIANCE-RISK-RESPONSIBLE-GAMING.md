# 05. Compliance, risk и ответственная игра

## 1. Jurisdiction engine

- правила по стране лицензии, стране игрока и фактической геолокации;
- allow/deny territories и региональные исключения;
- возраст, KYC tier, продукты, лимиты и legal docs по policy version;
- проверки при signup/login/deposit/play/withdrawal;
- VPN/proxy/TOR detection не является единственным основанием решения;
- manual review и объяснимая причина отказа там, где допустимо.

## 2. KYC/KYB

- identity, age и address verification;
- document + liveness при необходимости;
- duplicate identity detection;
- tiered due diligence по суммам и риску;
- source of funds/source of wealth workflows;
- periodic refresh и event-driven reverification;
- data minimization, encryption и retention;
- vendor decision хранится вместе с версией модели/правил;
- manual override только role + reason + reviewer.

## 3. AML/CFT

- customer risk score;
- sanctions, PEP и adverse media screening;
- blockchain address/transaction screening;
- transaction monitoring: velocity, structuring, pass-through, linked accounts, high-risk services, rapid withdrawal;
- alert → case → investigation → decision → reporting;
- Travel Rule поддерживается, если применима;
- ongoing monitoring и rescreening;
- regulatory reporting и prohibition on tipping-off;
- все thresholds конфигурируются по юрисдикции, а не задаются этим документом.

## 4. Fraud/account security

- credential stuffing, bot, promo abuse, multi-accounting;
- device fingerprint как сигнал, не единственный идентификатор;
- impossible travel, IP reputation, SIM/email changes;
- withdrawal address risk и account takeover score;
- rate limits, CAPTCHA по риску, step-up MFA;
- cooldown для password/MFA/address changes;
- chargeback отсутствует у BTC, но остаются stolen funds, scams и illicit-source risks;
- decisions имеют reason codes и appeal route.

## 5. Responsible gaming

- deposit, loss, wager и session time limits;
- cooling-off и self-exclusion;
- reality checks и activity statements;
- session timer всегда доступен;
- запрет отмены/ослабления лимита мгновенно: cooling period по лицензии;
- усиление лимита применяется немедленно;
- exclusion распространяется на все связанные бренды/аккаунты, если требуется;
- self-excluded пользователь не получает marketing/bonus reactivation;
- vulnerability indicators и human intervention workflow;
- ссылки на независимую помощь;
- журнал согласий, изменений лимитов и interventions.

## 6. Marketing compliance

- age/geo targeting;
- opt-in consent per channel;
- suppression self-excluded/vulnerable users;
- честные bonus claims и обязательные существенные условия;
- creative approval и архив версий;
- affiliate monitoring;
- frequency caps, unsubscribe, do-not-contact;
- запрет гарантированного выигрыша и давления срочностью.

## 7. Privacy

- data inventory и purpose/legal basis;
- consent records;
- access/correction/deletion/portability flows с законными исключениями;
- retention schedule и legal hold;
- processor/subprocessor register;
- breach response;
- cross-border transfer controls;
- secrets/seed/private keys не являются пользовательскими данными и не должны попадать в обычные системы.

## 8. Обязательный legal sign-off

Перед production юрист подтверждает: допустимость BTC gambling, custody/VASP статус, AML duties, Travel Rule, consumer disclosures, bonus terms, responsible gaming, data protection, tax/reporting, territorial restrictions, complaints/ADR и требования к сертификации поставщиков игр.
