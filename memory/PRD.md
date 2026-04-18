# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Mimari
- Frontend: Vanilla HTML/CSS/JS (CRA public/ + Vercel serverless)
- Backend: FastAPI (Python) - LiveScore proxy, WebSocket, stream proxy
- Dış API: LiveScore API, TheSportsDB
- Video: HLS.js

## Tüm Yapılan İşler

### Session 1 - 12 Nisan 2026
- Scoreboard race condition fix (hasLiveScoreData flag)
- BACKEND_URL dinamik (window.location.origin)
- PUBG Mobile reklam videosu (Steam CDN)
- Chrome Maç Merkezi fix
- Bildirim sistemi (push notification)
- Play Store yönlendirme (reklam bitince)

### Session 2 - 18 Nisan 2026
- GitHub güncel repo çekildi
- Scoreboard AI priority (GS/FB/BJK/TS öncelik + canlı/başlamadı döngüsü)
- eFootball 2026 video (EA SPORTS FC trailer)
- CoD Mobile video (Warzone trailer)
- Lords Mobile video (Civ VI trailer)
- DEMO 3 kanalı eklendi
- Cast butonu sol üste taşındı + Android Bluetooth yönlendirme
- MAÇ ÖNÜ + vs gösterimi (BAŞLAMADI/0:0 yerine)
- 5G mobil veri göstergesi
- Mobil responsive kontrol butonları
- Trendyol Süper Lig logosu (sadece logo, yazı yok)
- VT323 pixel font (Unix v12 benzeri)
- SessionStorage cache versiyonlama

### Optimizasyon Güncellemesi
- DNS prefetch + preconnect (CDN, fonts, API)
- GPU acceleration (will-change, translateZ)
- CSS contain (match-center, sponsor-section)
- HLS.js config: düşük buffer, hızlı başlama, progressive
- Loading timeout 15s → 10s
- Passive scroll listeners
- FPS sayacı (video üstünde)
- Mobil overflow fix (max-width: 100vw)
- Font smoothing + text rendering optimization

## Kalan İşler
- P1: S Sport m3u8 URL
- P1: beIN canlı m3u8 URL
- P1: Vercel deploy (serverless API dosyaları hazır)
- P2: S Sport API endpoint düzeltme
