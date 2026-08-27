# Компоненты

## `AppShell`

Отвечает за фон, max-width, header, main и footer. Не хранит бизнес-логику.

## `TopBar`

Состав: `WalletBalance`, `DepositButton`, `BrandMark`, `IconActions`, `ProfileMenu`.

- sticky допустим после прокрутки;
- header не должен перекрывать контент;
- на мобильном упрощается, а не горизонтально скроллится.

## `WalletBalance`

- отформатированная сумма;
- код/символ валюты;
- dropdown только при наличии нескольких валют;
- состояния loading и masked;
- значения приходят через props/API adapter.

## `SearchAndFilters`

- label доступен screen reader;
- debounce 150–250 ms только для удалённого поиска;
- Escape очищает строку;
- выбранная категория имеет `aria-pressed=true`;
- фильтры можно прокручивать горизонтально на мобильном.

## `GameGrid`

- CSS Grid, не жёсткая абсолютная раскладка;
- desktop: 12 колонок;
- featured portrait: 3×2 условных ячейки;
- landscape: 4–6 колонок;
- tablet: 2–3 карточки в строке;
- mobile: 2 компактные или 1 featured в строке;
- порядок DOM логичный независимо от masonry-вида.

## `GameCard`

Props:

```ts
type GameCardProps = {
  id: string;
  title: string;
  provider?: string;
  imageSrc: string;
  imageAlt: string;
  size: 'featuredPortrait' | 'landscape' | 'square';
  badge?: 'new' | 'popular' | 'jackpot';
  isFavorite?: boolean;
  isUnavailable?: boolean;
  loadingProgress?: number;
  onPlay: (id: string) => void;
  onFavorite: (id: string) => void;
};
```

Поведение:

- вся карточка доступна фокусом;
- CTA появляется на hover/focus, но остаётся доступным на touch;
- title и provider остаются HTML-текстом;
- прогресс загрузки показывает проценты и accessible label;
- недоступное состояние не реагирует как активное.

## `PlayButton`

- основной изумрудный CTA;
- текст `Играть`, icon optional;
- состояния default, hover, active, focus-visible, disabled, loading;
- не применять bouncing/pulsing по умолчанию.

## `GamePreviewDialog`

- название, изображение, провайдер, режим demo/real;
- кнопки `Играть` и `Отмена`;
- focus trap, Escape, возврат фокуса;
- явное подтверждение перед real-money режимом, если он появится.

## `BottomNav`

Только mobile: `Главная`, `Поиск`, `Избранное`, `Кошелёк`, `Профиль`. Учитывает safe-area.

## Системные состояния

- skeleton повторяет геометрию сетки;
- empty: понятное сообщение и сброс фильтров;
- error: текст причины и `Повторить`;
- offline: ненавязчивая полоса состояния;
- toast не используется для критических финансовых подтверждений.
