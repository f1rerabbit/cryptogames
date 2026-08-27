# Реализация

## Рекомендуемый стек для нового проекта

- Next.js (актуальная стабильная версия в репозитории);
- TypeScript strict;
- CSS Modules или существующая styling-система проекта;
- `next/image` для оптимизации локальных изображений;
- Lucide или существующий набор иконок;
- тесты: Vitest + Testing Library, если стек уже настроен.

Не обновляй зависимости без необходимости. Если проект использует React/Vite, Tailwind или иной стек, следуй существующим соглашениям.

## Предлагаемая структура

```text
src/
  app/lobby/
    page.tsx
  components/lobby/
    TopBar.tsx
    SearchAndFilters.tsx
    GameGrid.tsx
    GameCard.tsx
    GamePreviewDialog.tsx
    BottomNav.tsx
  data/
    games.ts
  styles/
    tokens.css
    lobby.module.css
public/
  games/
```

## Модель данных

```ts
type Game = {
  id: string;
  slug: string;
  title: string;
  provider: string;
  category: 'slots' | 'table' | 'live';
  image: string;
  alt: string;
  cardSize: 'featuredPortrait' | 'landscape' | 'square';
  tags: Array<'new' | 'popular' | 'jackpot'>;
  available: boolean;
};
```

## Правила кода

- semantic HTML: `header`, `nav`, `main`, `section`, `article`, `button`;
- не использовать `div` с click handler вместо кнопки;
- не хранить все карточки вручную в JSX;
- токены — CSS custom properties, без дублирования hex по компонентам;
- строки готовы к i18n: вынести в объект/словарь;
- денежные значения не хранить в float для реальных операций;
- UI не должен считать баланс или результат игры;
- никакой секретной логики, ключей и платёжных данных на клиенте;
- использовать mock adapters для кассы, запуска игры и профиля.

## Адаптив

- `>=1280`: полная мозаика, центральный logo;
- `1024–1279`: компактнее header, 3–4 обычные карточки;
- `768–1023`: упрощённая мозаика, 2–3 карточки;
- `<768`: mobile header, 2 compact cards или 1 featured, bottom nav;
- `<420`: 16 px gutters, кнопки без обрезки русского текста.

## Доступность

- WCAG 2.2 AA как ориентир;
- видимый `:focus-visible`;
- contrast обычного текста не ниже 4.5:1;
- alt описывает сюжет обложки, не повторяет имя файла;
- decorative glow скрыт от accessibility tree;
- анимации 150–250 ms и отключаются через reduced motion;
- модальные окна корректно управляют фокусом.

## Производительность

- первые visible covers получают priority осознанно, остальные lazy-load;
- резервировать aspect-ratio, исключить layout shift;
- изображения отдавать в разумных размерах WebP/AVIF;
- не тянуть видео и тяжёлые canvas-эффекты для первого экрана;
- целевые Lighthouse: Performance >= 85, Accessibility >= 95 на production build.

## Интеграционные границы

Frontend принимает данные через adapters:

- `getLobbyGames(filters)`;
- `getWalletSummary()`;
- `toggleFavorite(gameId)`;
- `createDepositIntent()`;
- `requestGameSession(gameId, mode)`.

До появления backend все методы должны быть моками с явными типами и без имитации настоящих денежных операций.
