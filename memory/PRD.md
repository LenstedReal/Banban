# banbansports UNDERGROUND HD - PRD

## Proje Bilgileri
- **Platform**: Cyberpunk/neon glitch canlı spor yayın platformu
- **Teknoloji**: Static HTML + FastAPI Backend + MongoDB
- **GitHub**: https://github.com/LenstedReal/Banban
- **Vercel**: banbansports987.vercel.app
- **Tarih**: 2026-04-12

## Mimari
- `/app/frontend/public/index.html` - Ana uygulama (tek dosya: HTML + CSS + JS)
- `/app/vercel-deploy/index.html` - Vercel deploy kopyası (her zaman senkron)
- `/app/backend/server.py` - FastAPI backend (skor API, stream proxy, WebSocket)
- `/app/backend/.env` - Gizli bilgiler (S Sport credentials)
- React DEVRE DIŞI (`src/index.js` sadece console.log)

## İmplemente Edilen Özellikler (2026-04-12)

### 1. Kanal Sistemi (14 kanal)
- DEMO 1, DEMO 2, REKLAM, TRT 1, TRT HABER, TV 8, TRT SPOR
- beIN SPORTS 1/2, S SPORT (premium - bakım modu)
- GS TV, FB TV, ATV, A SPOR (bakım modu)

### 2. REKLAM Kanalı
- MP4 video loop (30sn reklam formatı)
- Placeholder video kullanılıyor (ForBiggerEscapes)

### 3. Kalite Seçici UI
- Dropdown menü: AUTO, 4K, 1440p, 1080p, 720p, 480p, 360p
- HLS.js currentLevel ile entegre
- Bitrate bilgisi gösterimi

### 4. Yayın Donma/Çökme Algılama
- 5 saniye donma → Yenileme ikonu + "YAYIN DONDU" overlay
- 15+ saniye → Otomatik BAKIM MODU'na geçiş
- Tıkla veya bekle otomatik yenilenme
- Akıllı ayrım: kısa donma vs uzun çökme

### 5. Skorboard / Canlı Maç Verisi
- TheSportsDB eventsseason.php (eventsnextleague BUGGY - düzeltildi)
- Süper Lig + Şampiyonlar Ligi filtresi
- Türk takımları öncelikli
- WebSocket + HTTP polling fallback
- Backend 30 saniyede bir skor broadcast

### 6. S Sport Premium Entegrasyonu
- .env'de credentials (ASLA frontend'de görünmez)
- Backend proxy endpoint: /api/ssport/streams
- Login + token alma altyapısı hazır

### 7. beIN Sports Keşif
- data-reality.com discovery endpoint: /api/bein/discover
- Stream proxy: /api/stream/proxy (CORS bypass)

### 8. Tam Ekran / Ses / TV'ye Yansıt
- Cross-browser fullscreen (Chrome/Firefox/Safari/Edge + mobil)
- Ses toggle (ikon değişimli)
- PiP (küçük pencere) desteği
- Cast: Remote Playback API + AirPlay + Presentation API

### 9. Bağlantı Algılama
- WiFi/4G/3G/Mobil veri ikonu
- Navigator.connection API
- Lag algılandığında otomatik kalite düşürme

### 10. Scanlines + Noise Efekti
- CSS fixed overlay scanlines
- SVG noise texture

### 11. Sponsorlar (Güncel)
- MERİTKİNG eklendi, beIN SPORTS/NEF kaldırıldı
- 15 sponsor: PAPARA, TOGG, DigiTürk, Turkcell, SIXT, SOCAR, MERİTKİNG, THY, Garanti BBVA, AVIS, Terra Pizza, HDI Sigorta, Trendyol, Getir, Hepsiburada

### 12. Sunucu Sistemi
- 6 sunucu (Sunucu 1 Ana, Sunucu 2 Yedek, Sunucu 3 EU)
- Aktif sunucu geçişi
- Otomatik failover (sunucu çökünce sonrakine geç)

### 13. Backend API'ler
- GET /api/ - Health check
- GET /api/scores/live - Canlı skor
- GET /api/channels - Kanal durumları
- GET /api/stream/health - Stream sağlık kontrolü
- GET /api/stream/proxy - M3U8 proxy (CORS bypass)
- GET /api/stream/ts - TS segment proxy
- GET /api/ssport/streams - S Sport stream'leri
- GET /api/bein/discover - beIN keşif
- WebSocket /api/ws/scores - Canlı skor yayını

## Backlog (P0/P1/P2)

### P0 (Kritik)
- [ ] PUBG Mobile gerçek reklam videosu (YouTube'dan indir)
- [ ] beIN Sports stream URL keşfi ve bypass
- [ ] S Sport API login testi (gerçek hesapla)

### P1 (Önemli)
- [ ] Mackolik/XScore web scraping (yedek skor kaynağı)
- [ ] GS TV, FB TV, ATV, A SPOR stream URL'leri
- [ ] TRT Spor HTTPS düzeltmesi (HTTP → HTTPS redirect)

### P2 (İyileştirme)
- [ ] Chromecast SDK entegrasyonu
- [ ] Mobil uygulama optimizasyonu
- [ ] 2025-2026 sezonu için eventsseason güncelleme
- [ ] Admin paneli (kanal URL yönetimi)
