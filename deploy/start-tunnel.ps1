# Запуск постоянного HTTPS-туннеля для amidjob.duckdns.org (Windows, PowerShell)
# Предварительно один раз:
#   1) Скачать cloudflared-windows-amd64.exe:
#      https://github.com/cloudflare/cloudflared/releases
#      и положить как .\cloudflared.exe рядом с этим скриптом (или добавить в PATH)
#   2) cloudflared tunnel login
#   3) cloudflared tunnel create wordcards
#   4) Прписать DNS (см. комментарии ниже или deploy/cloudflared-config.yml)

$ErrorActionPreference = "Stop"
$Domain  = "amidjob.duckdns.org"
$Tunnel  = "wordcards"
$LocalPort = 8000

# --- Проверка, что локальный сервер поднят ----------------------------------
try {
    Invoke-WebRequest -UseBasicParsing "http://localhost:$LocalPort/" -TimeoutSec 3 | Out-Null
    Write-Host "OK: uvicorn отвечает на localhost:$LocalPort" -ForegroundColor Green
} catch {
    Write-Host "ВНИМАНИЕ: http://localhost:$LocalPort не отвечает." -ForegroundColor Yellow
    Write-Host "Сначала запустите в другом окне (из корня проекта):" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\Activate.ps1"
    Write-Host "  uvicorn api:app --host 127.0.0.1 --port $LocalPort"
}

# --- Вариант А (рекомендуется): DNS у Cloudflare -----------------------------
# Если вы перенесли домен amidjob.duckdns.org в Cloudflare DNS (NS-серверы
# changeip.com -> cloudflare.com не нужны; достаточно subdomain'а на аккаунте,
# либо используйте DuckDNS+Cloudflare так: домен registered в Cloudflare DNS via DuckDNS is not possible —
# проще: добавьте A-запись не нужна, туннель сам всё делает).
# Для туннеля запись создаётся один раз командой:
Write-Host "`nЕсли CNAME ещё не создан, выполните ОДИН РАЗ:" -ForegroundColor Cyan
Write-Host "  .\cloudflared.exe tunnel route dns $Tunnel $Domain"

# --- Вариант Б: DuckDNS без переноса в Cloudflare ----------------------------
# cloudflared route dns работает только с зонами в Cloudflare. Если хотите
# оставить DNS у DuckDNS, есть альтернатива без туннеля-имени: быстрый
# trycloudflare-туннель (URL будет МЕНЯТЬСЯ при каждом запуске!):
#   .\cloudflared.exe tunnel --url http://localhost:8000
# Тогда новый URL нужно каждый раз обновлять в BotFather и .env (MINI_APP_URL).

# --- Запуск -------------------------------------------------------------------
Write-Host "`nЗапускаю туннель $Tunnel..." -ForegroundColor Cyan
& .\cloudflared.exe tunnel run --config "$PSScriptRoot\cloudflared-config.yml" $Tunnel
