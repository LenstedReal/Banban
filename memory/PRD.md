# banbansports UNDERGROUND HD - PRD

## Proje Bilgileri
- **Platform**: Cyberpunk/neon glitch canlı spor yayın platformu
- **Teknoloji**: Static HTML + External JS + FastAPI Backend + MongoDB
- **GitHub**: https://github.com/LenstedReal/Banban
- **Vercel**: banbansports987.vercel.app
- **Son Güncelleme**: 2026-04-12

## Dosya Yapısı
- `/app/frontend/public/index.html` - Ana HTML (CSS + HTML yapısı)
- `/app/frontend/public/app.js` - Tüm JavaScript mantığı (external)
- `/app/frontend/public/reklam.mp4` - REKLAM kanalı video dosyası
- `/app/vercel-deploy/` - Vercel deploy kopyası (her zaman senkron)
- `/app/backend/server.py` - FastAPI backend
- `/app/backend/.env` - Gizli bilgiler (S Sport credentials)
- `/app/frontend/src/index.js` - React DEVRE DIŞI

## İmplemente Edilen Özellikler

### 1. Kanal Sistemi (14 kanal)
- DEMO 1/2, REKLAM (lokal MP4 reklam), TRT 1/Haber/Spor, TV 8
- beIN 1/2, S Sport (premium-bakım), GS TV, FB TV, ATV, A SPOR (bakım)

### 2. REKLAM Kanalı
- Lokal MP4 video loop + "REKLAM - PUBG MOBILE" overlay
- Gerçek Chrome'da çalışıyor (headless codec sorunu)

### 3. Kalite Seçici UI (AUTO/4K/1440p/1080p/720p/480p/360p)
### 4. Yayın Donma Algılama (5sn→yenile, 15sn→sunucu geçişi)
### 5. Skorboard (TheSportsDB eventsseason + WebSocket broadcast)
### 6. S Sport/beIN Backend Proxy Endpoints
### 7. Tam Ekran/Ses/PiP/Cast Kontrolleri
### 8. Volume Slider (premium UI)
### 9. Bağlantı Algılama (5G/4G/WiFi) - Video kontroller içinde
### 10. Scanlines + Noise Efekti (artırılmış)
### 11. Sponsor Logoları (Google Favicons + monochrome neon)
### 12. Sunucu Sistemi (6 sunucu, failover)
### 13. MAÇ MERKEZİ - Günlük maç listesi
- Süper Lig, Şampiyonlar Ligi, Serie A, Bundesliga, La Liga, Premier Lig
- Lig filtresi + skor kartları

## Test Sonuçları (Iteration 4)
- Backend: %100
- Frontend: %95 (minor: headless'ta connection 4G vs 5G)

## Backlog
### P0
- [ ] PUBG Mobile gerçek reklam videosu
- [ ] beIN/S Sport stream keşfi

### P1
- [ ] Mackolik web scraping
- [ ] GS TV, FB TV, ATV, A SPOR stream URL'leri

### P2
- [ ] Gol bildirimi (PWA Push)
- [ ] Chromecast SDK
