# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Tüm Yapılan İşler

### Session 1 - 12 Nisan 2026
- Scoreboard race condition fix
- BACKEND_URL dinamik
- PUBG Mobile reklam videosu
- Bildirim sistemi
- Play Store yönlendirme

### Session 2 - 18 Nisan 2026
- GitHub güncel repo çekildi
- Scoreboard AI priority (GS/FB/BJK/TS + döngü)
- 4 reklam videosu (PUBG, eFootball, CoD Warzone, Civ VI)
- DEMO 3 kanalı
- Cast butonu sol üst + Android yönlendirme
- MAÇ ÖNÜ + vs gösterimi
- 5G göstergesi
- Mobil responsive
- Trendyol Süper Lig logosu
- VT323 pixel font
- Performans optimizasyonu
- Scoreboard flash/çakışma düzeltmesi
- Kanal geçiş cleanup (streamSessionId)
- Offline scoreboard (localStorage cache)
- 15sn anlık güncelleme
- Maçkolik tarzı bildirim sistemi
- Yarınki maç desteği
- Server 3 (EU) Apple bipbop test stream düzeltmesi
- Push notification ikonları (8 PNG: goal, redcard, yellowcard, penalty, kickoff, halftime, fulltime, info)

### Session 3 - 23 Nisan 2026 (Ultra Derin Tarama)
- **DEMO → TRAILER** dönüşümü:
  - DEMO 1 → SİNTEL TRAILER (Akamai Sintel stream)
  - DEMO 2 → TEARS OF STEEL TRAILER (Türkçe altyazılı)
  - DEMO 3 → BIG BUCK BUNNY TRAILER (English altyazılı)
- **REKLAM kanalı kaldırıldı** - tab artık yok
- **Pre-roll ad sistemi** (oyun reklamları):
  - SADECE gerçek yayınlarda (TRT, beIN, TV8 vb.) - Trailerlerde ÇALIŞMAZ
  - ATLAMA YOK - reklam bitene kadar beklenir
  - Reklam bittiğinde otomatik yayın başlar (video.onended)
  - Reklam tıklanabilir → Play Store/mobile app yönlendirme
  - Session başına kanal başına 1 kez (retry/server-switch'te tekrarlanmaz)
- **Kritik DONMA hatası düzeltildi** (Çift Polling):
  - fetchLiveScore: setInterval DOMContentLoaded + startHttpPolling → ikisi de 15sn = 2x poll
  - fetchAllMatches: self-setTimeout + DOMContentLoaded setInterval = 2x poll
  - Çözüm: self-scheduling setTimeout chain (önceki tamamlanmadan yenisi başlamaz)
- **WebSocket ping interval stacking** düzeltildi (wsPingInterval tutucu değişken)
- **Freeze overlay double-retry** düzeltildi (_freezeAutoRetryTimer)
- **Preroll session cancel** (kullanıcı preroll sırasında kanal değiştirirse)
- **Goal scorer math** düzeltildi (ds1/ds2 delta)
- **Türk-only notification guard kaldırıldı** (yanlış eklenmişti - geri alındı)
- **Notification bildirimi onClick** hardcoded URL kaldırıldı (window.focus)
- **sw.js getSiteUrl** self.location.origin kullanır
- **Kanal butonları enine genişletildi** (padding 10px 22px, min-width 90px)
- **Bildirim button REDDEDİLDİ state** + kırmızı border
- **Mobile scoreboard** takım adı clamp + ellipsis taşma fix
- **notifQueue try/catch** (banner stuck engellenir)
- **Backend /channels** endpoint güncel isimlerle

## Kanal Stream Kaynakları
- SİNTEL: https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
- TEARS OF STEEL: demo.unified-streaming.com/.../tears-of-steel
- BIG BUCK BUNNY: test-streams.mux.dev/x36xhzz
- Sunucu 1 = Sunucu 2 (primary), Sunucu 3 = Akamai EU Kopenhag CDN

## Kalan İşler / Backlog
- P1: S Sport m3u8 URL (user sağlayacak)
- P1: beIN canlı m3u8 URL (user sağlayacak)
- P1: Vercel deploy (serverless API dosyaları hazır)
- P2: app.js refactor (1865 satır → modüller)
- P2: /app/backend/tests altında pytest regression
