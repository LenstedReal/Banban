# banbansports UNDERGROUND HD - PRD

## Proje Bilgileri
- **Platform**: Cyberpunk/neon glitch canlı spor yayın platformu
- **Teknoloji**: Static HTML + External JS (app.js) + FastAPI Backend + MongoDB
- **GitHub**: https://github.com/LenstedReal/Banban
- **Vercel**: banbansports987.vercel.app
- **Son Güncelleme**: 2026-04-12

## Dosya Yapısı
- `/app/frontend/public/index.html` - Ana HTML + CSS
- `/app/frontend/public/app.js` - Tüm JavaScript (external - CRA uyumlu)
- `/app/frontend/public/reklam.mp4` - REKLAM videosu (30sn MP4)
- `/app/vercel-deploy/` - Vercel deploy kopyası (senkron)
- `/app/backend/server.py` - FastAPI (LiveScore proxy, WebSocket, stream proxy)
- `/app/backend/.env` - S Sport credentials

## Çalışan Özellikler
1. 14 kanal (7 aktif, 7 bakım modu)
2. REKLAM: Lokal MP4 + PUBG MOBILE overlay
3. Kalite seçici (AUTO/4K-360p)
4. Donma algılama (5sn yenile, 15sn sunucu geçişi)
5. MAÇ MERKEZİ: LiveScore API ile 6 büyük lig (gerçek zamanlı)
6. Canlı skor banner (Türk maçı öncelikli)
7. Volume slider + ses kontrolleri
8. 5G/WiFi bağlantı göstergesi (video içinde)
9. Sunucu sistemi (6 sunucu, failover)
10. Sponsor logoları (Google Favicons)
11. Scanlines + noise efekti
12. WebSocket skor broadcast

## Kullanılan API'ler
- LiveScore API (backend proxy üzerinden)
- TheSportsDB (yedek)
- Google Favicons (sponsor logoları)

## Backlog
- [ ] beIN/S Sport stream kırma (m3u8 URL'leri gerekli)
- [ ] PUBG Mobile gerçek reklam videosu
- [ ] Gol bildirimi (PWA Push)
