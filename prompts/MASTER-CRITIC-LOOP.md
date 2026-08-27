# MASTER CRITIC LOOP — проверить, исправить, переснять

Ты выполняешь роль независимого senior product design, UX, accessibility и functional QA-критика, а затем Builder, который исправляет подтверждённые проблемы. Цикл повторяется до измеримого PASS либо объективного blocker.

## Подготовка

1. Прочитай `AGENTS.md`, `docs/PROJECT_STATE.md`, `docs/DESIGN-QUALITY-GATE.md`, `docs/design/`, acceptance checklist текущего этапа и git status/history.
2. Определи scope: последний завершённый мастер-промт. Не добавляй новые продуктовые функции вне scope.
3. Найди фактические команды запуска, seed accounts и routes. Не доверяй устаревшей документации — проверь.
4. Запусти clean production-like build с test fixtures. Если приложение не запускается, это P0; сначала диагностируй и исправь.

## На каждый раунд, максимум 5

### A. Critic

- Пройди все обязательные surfaces текущего этапа как реальный PLAYER и соответствующая ADMIN роль.
- Используй Playwright/browser для свежих screenshots на указанных viewport.
- Перед принятием каждого screenshot открой его и проверь правильность.
- Проверь не только happy path: validation, loading, empty, error, forbidden, duplicate submit и refresh.
- Проверь keyboard-only, focus order/visibility, accessible names, contrast tooling, reduced motion и overflow.
- Сопоставь UI с `docs/design/`, но не требуй пиксельного копирования исходного конкурентного референса.
- Проверь, что все кнопки/формы/фильтры работают, а не являются декоративными.
- Создай findings и scorecard строго по `docs/DESIGN-QUALITY-GATE.md`.

### B. Builder

- Сначала исправь P0, затем P1, затем P2.
- Для каждого finding добавь или обнови regression test.
- Не маскируй дефект ослаблением теста, удалением состояния, изменением score или исключением страницы.
- Сохраняй архитектуру и денежные инварианты.
- Не делай широкого редизайна вне findings.

### C. Verification

- Запусти релевантные unit/integration/e2e/a11y/visual tests.
- Повтори проблемные сценарии и сделай новые screenshots; старое evidence не подтверждает исправление.
- Закрой finding только с новым evidence и пройденным тестом.
- Пересчитай score.

## Критерий остановки

Остановись с `PASS` только при выполнении всех условий из `docs/DESIGN-QUALITY-GATE.md`. Если после 5 раундов PASS не достигнут или два раунда нет прогресса, остановись с `BLOCKED`, не скрывая остаточные проблемы.

## Обязательный результат

- полный список проверенных шагов и состояние каждого;
- accepted screenshots по порядку;
- итоговый score и severity counts;
- открытые/закрытые findings с evidence;
- точные test/build команды и результаты;
- `docs/PROJECT_STATE.md` обновлён;
- никаких заявлений о полном WCAG compliance только по screenshots;
- commit `fix: pass design quality critic gate` только если PASS и рабочее дерево до запуска позволяло безопасный commit.
