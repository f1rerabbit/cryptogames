# Визуальная система Midnight Emerald

## Характер

Премиальный тёмный entertainment-интерфейс: глубокий графит вместо фиолетового, изумруд вместо неонового синего, золото для важных статусов. Свечение контролируемое; читаемость важнее эффекта.

## Цветовые токены

```css
:root {
  --bg-canvas: #07110f;
  --bg-surface: #0c1b18;
  --bg-elevated: #122722;
  --bg-glass: rgba(13, 37, 31, 0.78);
  --text-primary: #f4fbf8;
  --text-secondary: #9eb8af;
  --text-muted: #6f8c83;
  --brand-primary: #19d38c;
  --brand-primary-hover: #38e6a4;
  --brand-primary-pressed: #10ae72;
  --brand-secondary: #64f5ca;
  --accent-gold: #f5c451;
  --accent-gold-hover: #ffd875;
  --border-soft: rgba(145, 255, 216, 0.16);
  --border-active: rgba(100, 245, 202, 0.72);
  --danger: #ff647c;
  --warning: #ffb85c;
  --success: #35d49a;
  --focus: #b8ffe8;
  --shadow-card: 0 16px 38px rgba(0, 0, 0, 0.34);
  --glow-brand: 0 0 28px rgba(25, 211, 140, 0.24);
}
```

## Альтернативные темы

Тему следует менять только заменой семантических токенов:

| Тема | Фон | Основной акцент | Второй акцент |
| --- | --- | --- | --- |
| Midnight Emerald | `#07110f` | `#19d38c` | `#f5c451` |
| Carbon Ruby | `#10090c` | `#ff405d` | `#ffcc73` |
| Arctic Cobalt | `#07101c` | `#397cff` | `#67e8f9` |

## Типографика

- UI: `Manrope`, fallback `Inter, system-ui, sans-serif`;
- display/логотип: оригинальный лицензированный шрифт или векторный знак;
- базовый размер: 16 px;
- заголовок секции: 24–32 px, 700;
- карточка: 16–20 px, 700;
- метаинформация: 13–14 px, 500;
- minimum mobile body: 14 px.

## Геометрия

- контейнер: max-width 1480 px;
- desktop padding: 32 px; tablet: 24 px; mobile: 16 px;
- spacing scale: 4, 8, 12, 16, 24, 32, 48;
- радиусы: 12 px controls, 20 px cards, 28 px panels;
- высота кнопки: 44–52 px;
- touch target: минимум 44×44 px;
- границы карточек тонкие, без двойной неоновой рамки.

## Фон и эффекты

- базовый тёмный градиент;
- 2–3 мягких radial glow-пятна;
- лёгкий шум допустим как локальный asset;
- избегать чрезмерного blur и постоянной анимации;
- в `prefers-reduced-motion` отключать parallax, shimmer и масштабирование.

## Обложки игр

- соотношения: portrait 3:4, landscape 16:9, square 1:1;
- единая художественная режиссура: космос, ар-деко, приключения, карты, кости;
- без чужих названий и персонажей;
- текст на обложке необязателен; название дублируется HTML-текстом;
- используйте локальные licensed/generated assets и `object-fit: cover`.
