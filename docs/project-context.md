# PickMe Store — Полный контекст проекта (обновлён 15.04.2026)

## О проекте
PickMe Store — интернет-магазин оригинальных брендовых вещей (Nike, Guess, Lacoste, Reebok, Puma, Adidas, NB, DKNY, CK, ASOS, Polo). Владелец — Валентина, бывший бортпроводник. Продаёт вещи со склада невыкупленных товаров крупного магазина. Средний чек 3500-8000₽. ЦА: женщины и мужчины 20-45, средний класс. Концепция — два дизайна: розовый пикми-ирония для женщин, мужская версия с переключением между светлой и тёмной темой. Обращение на «ты».

## Технический стек
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 5 + Pino (Node.js)
- **Database:** PostgreSQL + Drizzle ORM
- **API Codegen:** Orval (из OpenAPI spec)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **Разработка:** Claude Code (ранее — Replit Agent)
- **Репозиторий:** GitHub (private)
- **Монорепо:** pnpm workspaces (9 пакетов)

## Сервер
- **Рабочий сервер:** 91.229.9.156 (Ubuntu 22.04 LTS, reg.ru, Москва)
- **SSH:** `ssh root@91.229.9.156`
- **Домен:** pickmestore.ru (SSL установлен, HTTPS работает)

## Структура проекта на сервере
```
/var/www/pickme-store/
├── artifacts/
│   ├── pickme-store/     # React frontend (dist/public — собранные файлы)
│   └── api-server/       # Express backend (dist/ — собранные файлы)
├── lib/
│   └── db/               # Drizzle ORM схема и конфиг
├── uploads/              # Загруженные фото товаров
├── .env
└── package.json
```

## Локальная разработка (Claude Code)

### Расположение проекта
```
C:\Users\valen\OneDrive\Desktop\PickMe store\Project-Explorer\Project-Explorer\
```

### Запуск Claude Code
```powershell
cd "C:\Users\valen\OneDrive\Desktop\PickMe store\Project-Explorer\Project-Explorer"
claude
```

### Запуск Dev-сервера (второе окно PowerShell)
```powershell
cd "C:\Users\valen\OneDrive\Desktop\PickMe store\Project-Explorer\Project-Explorer\artifacts\pickme-store"
$env:PORT="3000"; $env:DATABASE_URL="postgresql://localhost:5432/fake"; $env:ADMIN_PASSWORD="test"; $env:BASE_PATH="/"; npx vite --host 0.0.0.0
```
- Предпросмотр: http://localhost:3000/
- Админка: http://localhost:3000/admin (пароль: pickme2026)
- API проксируется на реальный сервер pickmestore.ru (настроено в vite.config.ts)
- **ВАЖНО:** через localhost работаешь с реальной базой данных!

### Установленные Windows-зависимости
При переустановке node_modules нужны нативные пакеты:
```
pnpm add -w @rollup/rollup-win32-x64-msvc lightningcss-win32-x64-msvc @esbuild/win32-x64@0.27.3 @tailwindcss/oxide-win32-x64-msvc --ignore-scripts
```

## Переменные окружения (.env)
```
DATABASE_URL=postgresql://pickme:PickMe2026Store@localhost:5432/pickmestore
ADMIN_PASSWORD=pickme2026
NODE_ENV=production
PORT=3000
BASE_PATH=/
```

## Nginx конфигурация
Файл: `/etc/nginx/sites-available/pickmestore`
```nginx
server {
    server_name pickmestore.ru www.pickmestore.ru 91.229.9.156;
    root /var/www/pickme-store/artifacts/pickme-store/dist/public;
    index index.html;

    location ^~ /uploads/ {
        alias /var/www/pickme-store/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(css|js|woff|woff2|ttf|eot|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    location /product/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header User-Agent $http_user_agent;
    }

    location /gift/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header User-Agent $http_user_agent;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL managed by Certbot
}
```

## База данных
- Таблица products: brand, name, size, price, caption, category, status (available/sold), imageUrl, imageUrls, featured, sku, purchasePrice, telegramUrl, gender (women/men/unisex), badge, avitoLink, sortOrder, published, description, createdAt
- Поля замеров для штанов: outerSeam, innerSeam, riseHeight, halfWaist, halfHip, halfLegOpening, model
- Поле giftSuggestion (boolean) — подходит ли товар для подарка

## Процедура обновления сайта
1. Правки в Claude Code → проверка на localhost:3000
2. В Claude Code: `Закоммить все изменения и запуши на GitHub с сообщением "описание изменений"`
3. SSH на сервер: `ssh root@91.229.9.156`
4. Быстрая команда:
```
cd /var/www/pickme-store && git pull && pnpm install && export DATABASE_URL=postgresql://pickme:PickMe2026Store@localhost:5432/pickmestore && export ADMIN_PASSWORD=pickme2026 && export NODE_ENV=production && export PORT=3000 && export BASE_PATH=/ && cd artifacts/pickme-store && pnpm run build && cd ../api-server && pnpm run build && cd /var/www/pickme-store && DATABASE_URL=postgresql://pickme:PickMe2026Store@localhost:5432/pickmestore pnpm --filter @workspace/db run push && pm2 restart pickme
```
5. Ctrl+Shift+R в браузере для сброса кеша

## Ссылки
- **Telegram:** https://t.me/V_Limerence
- **Авито:** https://www.avito.ru/brands/946d93799084015ab8a605574a5b3661
- **MAX:** https://tinyurl.com/5h4bbmkr

---

## ЧТО СДЕЛАНО

### Базовый сайт (до апреля 2026)
- Лендинг со всеми блоками, розовая пикми-стилистика
- Каталог с фильтрами, поиском, сортировкой, пагинацией
- Админ-панель с загрузкой фото, артикулом, ценой закупки
- Страницы товаров /product/:id
- Мультифото в карточках товаров
- Развёрнуто на российском VPS

### Инфраструктура (апрель 2026)
- ✅ SSL сертификат установлен (certbot)
- ✅ robots.txt и sitemap.xml добавлены
- ✅ Сайт зарегистрирован в Яндекс.Вебмастер и Google Search Console
- ✅ Кэш статики настроен в Nginx (картинки 30 дней, CSS/JS 7 дней)
- ✅ Open Graph теги для товаров

### Мобильная версия
- ✅ Hero без фото и бейджей на < 768px
- ✅ Компактные карточки 2 в ряд в каталоге
- ✅ Секции по категориям с горизонтальной прокруткой на главной

### Двойная тема — 5 этапов
- ✅ **Этап 1** (бэкенд) — giftSuggestion в БД, фильтрация по gender, роут /gift/:id, query-параметр random=true
- ✅ **Этап 2** (CSS-переменные) — замена хардкод-цветов на переменные, ThemeContext (gender + mode), три темы: female, male, male-dark
- ✅ **Этап 3** (splash screen) — экран выбора «Для неё / Для него» (символы ♀/♂, подпись «Переключиться можно в любой момент в меню»), переключатели в хедере
- ✅ **Этап 4** (контент) — тексты для мужской версии, фильтрация каталога по полу, секция «Подарок для неё», рандомизация товаров на главной
- ✅ **Этап 5** (подарки) — страница /gift/:id (без цены, без кнопок, только витрина), кнопка «Согласовать подарок» на /product/:id с Web Share API и тултипом-подсказкой

### Доработка мужской темы (в процессе)
- ✅ Убраны декоративные glow-эффекты и разделители
- ✅ Карточки товаров/отзывов тёмные в dark-теме
- ✅ Фото «Обо мне» без цветной рамки и лепестков
- ✅ Hero — текст по левому краю
- 🔄 Шрифт Caveat заменён на Montserrat (возможно остались прямые упоминания)
- 🔄 CTA кнопка Telegram — цвет через переменные
- 🔄 Footer — цвета через переменные
- 🔄 Фон страницы — убрать неоднородные пятна/декоративные градиенты
- 🔄 Контраст текстов (отзывы, описания)
- 🔄 Перевод на Claude Code (локальная разработка вместо Replit)

---

## ДИЗАЙН — ТРИ ТЕМЫ

### Женская тема (female) — по умолчанию
```css
:root, [data-theme="female"] {
  --color-primary: #f04586;
  --color-primary-hover: #d63a75;
  --color-primary-light: #fce4ec;
  --color-primary-bg: rgba(240,69,134,0.06);
  --color-primary-border: rgba(240,69,134,0.12);
  --color-bg: #fdf0f4;
  --color-bg-page: #f8e8ee;
  --color-surface: rgba(255,255,255,0.8);
  --color-surface-alt: rgba(255,255,255,0.6);
  --color-card-bg: rgba(255,255,255,0.8);
  --color-text-heading: #333;
  --color-text-body: #555;
  --color-text-muted: #888;
  --color-border: rgba(0,0,0,0.06);
  --font-heading: 'Playfair Display', serif;
  --font-accent: 'Caveat', cursive;
  --font-body: 'Nunito', sans-serif;
}
```

### Мужская светлая тема (male)
```css
[data-theme="male"] {
  --color-primary: #0074c4;
  --color-primary-hover: #005fa3;
  --color-primary-light: rgba(0,100,190,0.06);
  --color-primary-bg: rgba(0,100,190,0.06);
  --color-primary-border: rgba(0,100,190,0.12);
  --color-bg: #f4f5f7;
  --color-bg-page: #eceef2;
  --color-surface: #ffffff;
  --color-surface-alt: #f6f8fb;
  --color-card-bg: #ffffff;
  --color-text-heading: #1a1d28;
  --color-text-body: #4a4f5c;
  --color-text-muted: #8a90a0;
  --color-border: rgba(0,0,0,0.06);
  --color-gift-bg: rgba(200,40,90,0.04);
  --color-gift-border: rgba(200,40,90,0.10);
  --color-gift-accent: #c0456e;
  --font-heading: 'Cormorant Garamond', serif;
  --font-accent: 'Montserrat', sans-serif;
  --font-body: 'Montserrat', sans-serif;
}
```

### Мужская тёмная тема (male-dark)
```css
[data-theme="male-dark"] {
  --color-primary: #5aacf0;
  --color-primary-hover: #4a9ae0;
  --color-primary-light: rgba(90,172,240,0.06);
  --color-primary-bg: rgba(90,172,240,0.08);
  --color-primary-border: rgba(90,172,240,0.15);
  --color-bg: #111118;
  --color-bg-page: #0e0e14;
  --color-surface: #161722;
  --color-surface-alt: rgba(90,172,240,0.03);
  --color-card-bg: #161722;
  --color-text-heading: #e0e8f0;
  --color-text-body: #c8ccd6;
  --color-text-muted: #7a8090;
  --color-border: rgba(90,172,240,0.10);
  --color-gift-bg: rgba(233,30,99,0.03);
  --color-gift-border: rgba(233,30,99,0.12);
  --color-gift-accent: #e091b0;
  --font-heading: 'Cormorant Garamond', serif;
  --font-accent: 'Montserrat', sans-serif;
  --font-body: 'Montserrat', sans-serif;
}
```

### Переключение тем
- ThemeContext: gender (female/male) + mode (light/dark)
- female → data-theme="female"
- male + light → data-theme="male"
- male + dark → data-theme="male-dark"
- localStorage: pickme-gender, pickme-mode
- При переключении на female — mode сбрасывается на light
- URL не меняется при смене темы

### Правила мужской темы
- БЕЗ шрифта Caveat (нигде)
- БЕЗ декоративных glow/blur/лепестков/блёсток
- БЕЗ розовых цветов (кроме секции подарков)
- БЕЗ радиальных градиентов на фоне
- Фон ровный, однородный
- Все шрифты: Cormorant Garamond (заголовки) + Montserrat (всё остальное)

### Хедер
- **Женская:** кнопка «Для него» → переключает на мужскую тему
- **Мужская:** кнопка «Для неё» (розовая) + кнопка «☽ Тёмная / ☀ Светлая» + «Написать мне»

### Splash Screen (первый визит)
- Две карточки: ♀ «Для неё» (розовая) и ♂ «Для него» (синяя)
- Без подписей «Женская/Мужская коллекция»
- Подпись снизу: «Переключиться можно в любой момент в меню»
- НЕ показывается на /product/:id и /gift/:id

### Страница /gift/:id
- Всегда в женской теме (не сохраняя в localStorage)
- Без цены, без кнопок действия, без артикула
- Плашка «🎁 Подарочная ссылка — цена скрыта»
- OG-теги без цены
- Splash screen не показывается
- Если товар не найден: «Этот подарок уже нашёл своего владельца 💝»

### Кнопка «Согласовать подарок» (на /product/:id)
- Показывается только если giftSuggestion === true
- Web Share API → fallback: копирование ссылки
- Тултип с подсказкой (иконка ❓): «Нажми, чтобы поделиться ссылкой на этот товар. Получатель увидит фото и описание, но цена будет скрыта.»

---

## ЧТО НУЖНО СДЕЛАТЬ

### Доработка мужской темы (приоритет)
- Заменить все прямые упоминания Caveat на var(--font-accent)
- Заголовок «Подарок для неё» — Cormorant Garamond italic, не Caveat
- CTA кнопка Telegram — цвет var(--color-primary), не захардкоженный cyan
- Footer логотип — цвет через переменные
- Убрать неоднородные фоновые пятна (радиальные градиенты, ::before/::after с blur)
- Текст отзывов — поднять контраст в dark-теме до var(--color-text-body)
- Текст «Обо мне» — шрифт var(--font-body) = Montserrat, не serif
- Битое фото Air Force в секции подарков — проверить imageUrl

### Другие задачи
- Таймер бронирования товаров
- Telegram-бот для уведомлений о новых товарах
- Внутренний чат на сайте (через Telegram-бота)
- Футболки WinRace — отдельный лендинг (контекст в файле winrace-context.md)
- Смена пароля админки на надёжный

## Полезные команды на сервере
```bash
pm2 status                    # статус
pm2 logs pickme --lines 20    # логи
pm2 restart pickme             # перезапуск
systemctl restart nginx        # перезапуск Nginx
nginx -t                       # проверка конфига Nginx
```

## Бэкапы

### Автоматический бэкап базы данных (настроен 15.04.2026)
На сервере настроен cron — каждую ночь в 3:00 создаётся дамп базы:
```
0 3 * * * PGPASSWORD=PickMe2026Store pg_dump -U pickme -h localhost pickmestore | gzip > /root/backups/pickme-$(date +\%Y\%m\%d).sql.gz
```
Файлы хранятся в `/root/backups/` с датой в названии (pickme-20260415.sql.gz и т.д.).

### Скачивание бэкапов на компьютер (вручную, раз в неделю)
В PowerShell на своём компе:
```powershell
scp root@91.229.9.156:/root/backups/*.sql.gz C:\Users\valen\pickme-backup.sql.gz
move -Force C:\Users\valen\pickme-backup.sql.gz "C:\Users\valen\OneDrive\Desktop\PickMe store\backups\"
```

### Бэкап фото товаров (вручную, периодически)
Фото не хранятся в git. Скачивать с сервера:
```powershell
scp -r root@91.229.9.156:/var/www/pickme-store/uploads/ "C:\Users\valen\OneDrive\Desktop\PickMe store\backups\uploads\"
```
