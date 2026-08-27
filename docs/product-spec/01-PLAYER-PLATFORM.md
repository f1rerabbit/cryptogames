# 01. Пользовательская платформа

## 1. Регистрация и вход

- `ID-001`: регистрация по email/телефону либо разрешённому identity provider.
- `ID-002`: подтверждение контакта одноразовым кодом с rate limit.
- `ID-003`: пароль с безопасной политикой; поддержка passkeys как рекомендуемый путь.
- `ID-004`: MFA обязательно перед выводом и изменением security settings.
- `ID-005`: session/device management: список сессий, отзыв, уведомление о новом устройстве.
- `ID-006`: password reset не должен обходить withdrawal cooldown.
- `ID-007`: возраст, страна проживания, принятие ToS/Privacy/Bonus Terms с version ID.
- `ID-008`: геопроверка при регистрации, входе, депозите, запуске real-money игры и выводе.
- `ID-009`: блокировка duplicate accounts по правилам риска, с процедурой апелляции.

## 2. Профиль

- персональные данные и верификационный статус;
- безопасность, MFA, доверенные устройства;
- язык, часовой пояс и уведомления;
- responsible-gaming limits;
- KYC документы и запросы source of funds;
- история входов, ставок, бонусов, депозитов и выводов;
- privacy requests и закрытие аккаунта;
- VIP статус без скрытых условий.

## 3. Лобби и каталог

- `LOB-001`: CMS-секции, категории, поиск, фильтры, избранное, недавно сыгранные.
- `LOB-002`: видимость игр зависит от страны, устройства, KYC, валюты и maintenance status.
- `LOB-003`: banners и позиции имеют расписание, сегмент и legal disclaimer.
- `LOB-004`: недоступная игра объясняет причину.
- `LOB-005`: demo и real-money режимы визуально различаются.
- `LOB-006`: responsible-gaming статус может мгновенно запретить запуск.
- `LOB-007`: frontend не определяет результат игры и не изменяет баланс.

## 4. Игровая сессия — интеграционная оболочка

Сам игровой движок исключён, но платформа обязана:

- запросить серверный session token у provider gateway;
- проверить eligibility, limits, KYC, geo, exclusion и доступный баланс;
- создать неизменяемый session record;
- принимать signed callbacks bet/win/refund/rollback;
- дедуплицировать provider transaction ID;
- поддерживать atomic bet/win и компенсацию;
- закрывать или приостанавливать сессию при лимите времени/самоисключении;
- отображать текущий денежный и бонусный баланс;
- иметь reality check по заданному интервалу;
- сохранять историю раундов и ссылку на dispute process.

## 5. Касса

Вкладки: `Пополнить`, `Вывести`, `История`, `Лимиты`.

- QR и копирование Bitcoin address;
- предупреждение `только BTC в выбранной сети`;
- сумма в BTC и sats, необязательный ориентир в фиате с timestamp курса;
- статусы: awaiting payment, mempool, confirming, credited, risk hold, failed/reorg;
- вывод: address, amount, fee policy, net amount, ETA range, MFA confirmation;
- address validation и явное подтверждение полного адреса;
- адресная книга с cooldown после добавления/изменения;
- история с txid/explorer link только после безопасной публикации транзакции;
- экспорт CSV/PDF по разрешённой политике.

## 6. Бонусный центр

- доступные, активные, завершённые и истёкшие предложения;
- прогресс wagering, оставшееся время, eligible games/contribution;
- выбор opt-in/opt-out с предупреждением о последствиях;
- ввод промокода;
- календарь ежедневных наград;
- понятное разделение cash и bonus funds.

## 7. Уведомления

Каналы: in-app, email, SMS, push при наличии согласия.

Обязательные: security change, новый вход, KYC status, депозит credited/held, вывод requested/approved/rejected/broadcast, limit change, self-exclusion, изменённые legal terms. Маркетинг не объединяется с транзакционным согласием.

## 8. Поддержка

- help center и поиск;
- тикет с категорией и вложениями;
- безопасный чат без передачи seed/private key;
- dispute по депозиту, выводу, бонусу или игровому раунду;
- SLA и status timeline;
- экспорт переписки и privacy controls.

## 9. Footer/legal

18+, владелец и номер лицензии, разрешённые территории, ToS, Privacy, AML/KYC, Bonus Terms, Responsible Gaming, Complaints/ADR, Cookie Settings, контакты и дата версии документов.
