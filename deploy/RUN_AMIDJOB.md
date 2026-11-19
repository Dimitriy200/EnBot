# Запуск с постоянным доменом amidjob.duckdns.org (Windows)

## Почему у вас был Error 1033
`https://xxxx.trycloudflare.com` — это **временный** URL quick-туннеля. Он живёт
только пока запущен процесс `cloudflared tunnel --url ...`. Как только окно с
cloudflared закрылось (или он упал), Cloudflare отдаёт ошибку **1033**.
Регистрация DuckDNS-домена сама по себе ничего не пробрасывает: домен никуда
не указывает, поэтому и его использовать пока нельзя.

Дальше — два рабочих пути. **Рекомендую путь 1** (постоянный URL, перестаёте
каждый раз переписывать адрес в BotFather).

---

## Путь 1 (рекомендуется): cloudflared Access + ваш домен amidjob.duckdns.org

Смысл: домен направляется на Cloudflare-туннель (CNAME), туннель пробрасывает
трафик на ваш локальный `localhost:8000`. HTTPS-сертификат даёт Cloudflare —
никаких certbot/nginx не нужно. Домен остаётся у DuckDNS, переносить ничего не надо.

### Шаг 1. Один раз: создать туннель через браузер (Zero Trust Dashboard)
1. Скачайте `cloudflared-windows-amd64.exe` с
   https://github.com/cloudflare/cloudflared/releases
   и переименуйте, например, в `C:\tools\cloudflared.exe`.
2. Откройте https://one.dash.cloudflare.com → войдите/зарегистрируйтесь в Cloudflare (бесплатно).
3. **Networks → Tunnels → Create a tunnel → Cloudflared**, имя: `wordcards`,
   Save tunnel → скачайте `config.yml` (в нём будет ваш `account_id` и токен) —
   сохраните как `deploy\cloudflared-config.yml` в проекте (или используйте готовый
   шаблон `deploy/cloudflared-config.yml`, подставив путь к credentials-файлу).
4. На вкладке **Public Hostname** нажмите **Add a public hostname**:
   - Subdomain: `amidjob` ; Domain: нажмите **Add a domain** → введите `amidjob.duckdns.org`
     (Cloudflare проверит его через свой DNS, добавлять зону вручную НЕ нужно);
   - Service URL: `http://localhost:8000` → Save hostname.
5. Сохраните скачанный Dashboard `config.yml` как `deploy\cloudflared-config.yml`
   (в нём уже будут правильный `tunnel: <UUID>` и `credentials-file`).

### Шаг 2. Каждый раз при запуске (PowerShell, из корня проекта)
```powershell
# Окно 1 — сервер (раздаёт фронт + API):
.\.venv\Scripts\Activate.ps1
uvicorn api:app --host 127.0.0.1 --port 8000

# Окно 2 — туннель (можно и скриптом deploy\start-tunnel.ps1):
C:\tools\cloudflared.exe tunnel run --config deploy\cloudflared-config.yml wordcards
```

### Шаг 3. Проверка
Откройте в браузере **https://amidjob.duckdns.org/** — должна появиться карточка-приложение.
Этот URL больше **не меняется**, пока существует туннель.

### Шаг 4. Прописать URL один раз
- `.env`: `MINI_APP_URL=https://amidjob.duckdns.org/` → перезапустить бота `python main.py`
- @BotFather → Your bot → Bot Settings → **Menu Button** → Web App URL: `https://amidjob.duckdns.org/`

---

## Путь 2 (быстрый тест): оставить trycloudflare, но не закрывать окно
```powershell
C:\tools\cloudflared.exe tunnel --url http://localhost:8000
```
URL вида `https://xxxx.trycloudflare.com` действует, **пока не закрыт этот процесс**.
Error 1033 = процесс tуннеля остановлен или ещё не поднялся. Решения:
1. Перезапустите команду — получите новый URL (старый мёртв навсегда);
2. Новый URL сразу впишите в BotFather и `.env`, перезапустите бота;
3. Не закрывайте окно PowerShell с cloudflared во время теста.
Минус: URL меняется при каждом перезапуске — для постоянной работы неудобен,
поэтому и предложен Путь 1 с вашим доменом.

---

## Чек-лист «почему не открывается»
| Симптом | Причина / решение |
|---|---|
| Error 1033 | cloudflared не запущен / упал → перезапустить (Путь 2) или перейти на постоянный туннель (Путь 1) |
| Error 1016 / DNS не резолвится | CNAME `amidjob -> <TUNNEL_ID>.cfargotunnel.com` ещё не применился в DuckDNS (подождать ~5 мин) или TUNNEL ID указан неверно |
| Локально `http://localhost:8000` не отвечает | не запущен uvicorn или `webapp/dist` не собран (`cd webapp; npm run build`) |
| В Telegram белая страница | в BotFather указан старый/не https URL; проверьте `MINI_APP_URL` в `.env` |
