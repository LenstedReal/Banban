# banbansports UNDERGROUND HD - PRD

## Problem Statement
Kullanıcı: "Projemdeki hataları derinlemesine analiz et ve bildir" (repo: https://github.com/LenstedReal/Banban)
Türkiye odaklı IPTV/spor/film streaming platformu. 14+ kanal (TRT1, TRT Haber, TV8, TRT Spor, beIN Sports 1/2, S Sport, AS TV, FB TV, ATV, A Spor, Hızlı Öfkeli 11, Spider-Man BND vs.). Live futbol skorları, maç merkezi, reklam sistemi, çok dilli altyazı (TR/EN/OFF), bildirimler, sponsor görünümü.

## Tech Stack
- Frontend: **Static HTML+JS** (React disabled). `/app/frontend/public/index.html` (938 satır) + `app.js` (2720+ satır) + inline CSS. CRA sadece dev server olarak kullanılıyor.
- Backend: FastAPI + MongoDB + httpx + websockets. LiveScore API proxy, scores live endpoint, stream health, beIN m3u8 manifest üretimi.
- Deploy: Vercel (serverless) — `/app/vercel-deploy/` klasörü production kopyası.

## Session Log

### Session 4 (Apr 24, 2026) - Deep Analysis + Bug Fixes
**Yapılan düzeltmeler:**
1. **Scoreboard alakasız maç gösterme** — `fetchLiveScore`'da `bigKeys` listesi Singapur "Premier League"'i de büyük lig sayıyordu. `bigCountries` + `bigLeagueNames` AND mantığına çevrildi. Sadece gerçek Avrupa üst liglerini + Türk maçlarını gösterir. Cache de Türk olmayan maçları filtreliyor.
2. **"YAYIN BAŞLIYOR..." badge kaldırıldı** — Subtitles kutusuyla görsel çakışması. REKLAM badge yeterli.
3. **REKLAM badge tıklanabilir** — Reklam sırasında "REKLAM · Standoff 2 · TIKLA" → Play Store'a yönlendiriyor.
4. **Audio autoplay unlock** — Start screen click → video.play().pause() + AudioContext.resume() → sonra setupStream. Autoplay engellenirse muted fallback + unmute button.
5. **Ragga Oktay - Hasretim Gitme Kal** — Hızlı ve Öfkeli 11 "YAKINDA" ekranına eklendi (SoundCloud'dan 4.4MB MP3). Info bandına tıkla → play/pause.
6. **Shelby görseli açma** — filter:brightness 0.65→0.92, overlay gradient 0.92→0.75 → yüz net görünüyor.
7. **Nesine logo** — Yeni profesyonel SVG (yeşil "nesine.com"). Sabit 120x40px + PNG fallback.
8. **Emergent visual-edits kapatıldı** — craco.config.js `withVisualEdits` devre dışı. Kullanıcı "emergent ibareleri istemiyorum" dedi.
9. **Tablet responsive** — 769-1024px breakpoint eklendi, header sıkışması giderildi.
10. **Vercel sync** — app.js/index.html/nesine_logo.svg/ragga_oktay.mp3 → `/app/vercel-deploy/` dizinine kopyalandı.

### Önceki sessionlar (PRD'de not)
- Shelby başlatma ekranı, server 1/2/3 dil farklılaştırma, CC OFF fix, i18n
- Reklam sistemi (Clash, PUBG, COD, Free Fire, Standoff 2, Lords Mobile, eFootball)
- LiveScore integration, scoreboard cycle, match center

## Known Issues / Backlog
- **P2**: Ağır refactor — `app.js` 2720 satır, modüllere bölünebilir
- **P2**: `backend_test.py` eski URL, reklam kanalı hâlâ test ediyor → güncelleme
- **P2**: FastAPI `@app.on_event` deprecated, lifespan'e geçiş
- **P3**: Unused React/CRA bağımlılıkları temizle (500MB node_modules)
- **P3**: Logo Clearbit bazı kullanıcılarda bloklanabilir (şu an çalışıyor)

## Test Status
- Frontend screenshot: ✅ (1080x1920 tablet mode — tüm elemanlar düzgün)
- Backend API: ✅ (/api/channels, /api/scores/live, /api/livescore/today, /api/stream/health, WS /api/ws/scores)
- Scoreboard: ✅ Eyupspor vs Gaziantep FK (Trendyol Süper Lig) - Tampines Rovers gitti
- Reklam + Ragga Oktay + Nesine logo: ✅ Ekran doğrulandı

