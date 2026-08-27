# 03. Бонусы, промокоды и лояльность

## 1. Bonus Engine

Типы:

- welcome bonus;
- deposit match;
- fixed bonus in sats;
- free spins/free rounds как entitlement провайдера;
- cashback/rakeback;
- reload bonus;
- no-deposit bonus;
- daily login reward;
- streak/calendar reward;
- mission/achievement;
- referral reward;
- tournament/leaderboard prize;
- manual goodwill credit;
- VIP reward.

`BON-001`: каждый тип создаётся шаблоном с версией и immutable опубликованными условиями.  
`BON-002`: campaign задаёт страны, сегменты, время, бюджет, лимит активаций и priority.  
`BON-003`: eligibility проверяется сервером при показе, активации и начислении.  
`BON-004`: bonus cash хранится отдельно от cash.  
`BON-005`: wagering contribution задаётся по игре/категории/провайдеру.  
`BON-006`: max bet, min odds при применимости, max conversion/win, expiry и excluded games конфигурируются.  
`BON-007`: правила использования cash/bonus определяются wallet strategy и явно показаны игроку.  
`BON-008`: изменение условий не применяется задним числом к активированному бонусу.  
`BON-009`: cancellation/expiry/forfeit создают ledger entries и audit events.  
`BON-010`: бонус невозможно выдать сверх campaign budget без отдельного approval.

## 2. Промокоды

- формат и регистр; хранить нормализованный hash при необходимости;
- single-use, multi-use, personal, affiliate, batch codes;
- validity window и timezone;
- max total/per-user/per-device/household;
- eligible country, KYC tier, deposit range, player segment;
- combinability/exclusivity group;
- abuse velocity и brute-force rate limit;
- redemption preview до активации;
- понятные error codes: invalid, expired, exhausted, ineligible, already used;
- импорт/экспорт batch codes с ограниченным доступом;
- полный audit: кто создал, утвердил, экспортировал и использовал.

## 3. Daily rewards

- календарь 7/14/30 дней или rolling sequence;
- server-side определение игрового дня и timezone policy;
- claim вручную, а не скрытое автоначисление;
- одно начисление на player/day, идемпотентно;
- grace period и reset/missed-day policy;
- streak repair только по утверждённому правилу;
- reward types: bonus sats, spins, loyalty points, mystery reward с опубликованными вероятностями;
- защита multi-account/device farming;
- reward calendar и будущие награды видны заранее;
- уведомления с marketing consent;
- daily reward не подталкивает self-excluded/cooling-off пользователя к возврату.

## 4. Cashback

- формула только от утверждённой базы: net loss/GGR/turnover;
- исключение бонусных ставок, chargebacks, fraud и void rounds;
- период и cutoff фиксированы;
- cap, minimum, percentage tier;
- preview считается отдельно, финальное начисление после reconciliation;
- negative carryover явно определяется;
- начисление — ledger transaction с formula snapshot.

## 5. VIP/loyalty

- points ledger отдельно от денежного ledger;
- уровни, qualification window, decay и downgrade policy;
- benefits по версии условий;
- manual VIP assignment требует approval;
- запрет персонального стимулирования уязвимых/self-excluded игроков;
- VIP manager не имеет возможности самостоятельно начислять/выводить деньги;
- affordability/source-of-funds checks по требованиям лицензии.

## 6. Referral/Affiliate

- referral link/code, атрибуция и окно;
- qualifying event только после KYC/risk conditions;
- запрет self-referral и household/device duplicates;
- reward hold до завершения fraud window;
- партнёрская комиссия не рассчитывается клиентом;
- negative carryover, CPA/revshare/hybrid задаются договором;
- affiliate creatives и claims проходят compliance approval.

## 7. Админка бонусов

Конструктор campaign должен иметь draft → review → approved → scheduled → active → paused → ended. До публикации показывается симуляция на тестовом пользователе, оценка максимальной liability и читаемый preview Bonus Terms. Опубликованная версия неизменна; правка создаёт новую версию.

## 8. Bonus abuse rules

Сигналы: общие устройства/IP/адреса вывода, circular funds, rapid deposit-withdraw, минимально-рисковые паттерны wagering, promo enumeration, emulator/VPN/TOR, linked accounts. Автоматические решения ограничиваются policy; конфискация средств без review и юридического основания запрещена.
