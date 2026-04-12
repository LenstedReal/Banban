# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Mimari
- **Frontend**: Vanilla HTML/CSS/JS (CRA public/ dizininde barındırılıyor)
- **Backend**: FastAPI (Python) - LiveScore proxy, WebSocket skor yayını, stream proxy
- **Dış API'ler**: LiveScore API (gerçek zamanlı skorlar), TheSportsDB (fallback)
- **Yayın**: HLS.js ile m3u8 stream desteği

## Yapılan İşler

### Session 1 - 12 Nisan 2026

#### Bug Fix #1: Scoreboard Race Condition
- `hasLiveScoreData` flag'i ile WebSocket'in LiveScore API verisinin üzerine yazması engellendi

#### Bug Fix #2: BACKEND_URL Hardcoded Domain
- Hardcoded `cyberpunk-canli-tv` yerine dinamik `window.location.origin` kullanıldı

#### Bug Fix #3: PUBG Mobile Reklam Videosu
- Steam CDN'den PUBG F2P Gameplay Trailer indirildi, 20sn klip kesildi
- WebM (VP9) ve MP4 (H.264) dual format ile fallback mekanizması

#### Bug Fix #4: Chrome Maç Merkezi
- BACKEND_URL düzeltmesiyle 23 maç kartı düzgün yükleniyor

### Session 2 - 12 Nisan 2026

#### Feature: Bildirim Sistemi
- Browser Push Notification desteği eklendi
- Header'da BİLDİRİM toggle butonu (zil ikonu)
- Maç başladığında, gol olduğunda, devre arasında, maç bittiğinde bildirim gönderiliyor
- Aynı olay için tekrarlı bildirim engelleme
- `toggleNotifications()`, `sendMatchNotification()`, `sendNotification()` fonksiyonları

#### Improvement: REKLAM Video Text Overlay Kaldırıldı
- Video üzerindeki sarı "PUBG MOBILE" yazısı kaldırıldı
- Sadece "REKLAM - PUBG MOBILE" badge gösteriliyor

#### Improvement: REKLAM Play Store Yönlendirme
- Video loop kaldırıldı (`loop: false`)
- Video bittiğinde otomatik Play Store PUBG Mobile sayfasına yönlendirme (`onended`)

## Temel Özellikler
- 14 kanal desteği (DEMO, TRT, beIN, S SPORT, vb.)
- Canlı skor tabelası (LiveScore API + WebSocket)
- Maç Merkezi (6 lig, 23+ maç kartı)
- Browser push bildirimleri (maç başlangıcı, gol, devre arası, maç sonu)
- HLS stream player (kalite seçici, ses kontrolü, tam ekran, PiP)
- Stream donma/crash algılama ve otomatik sunucu geçişi
- PUBG Mobile reklam (20sn video + Play Store yönlendirme)

## Kalan İşler / Backlog
- P1: beIN SPORTS, S SPORT, GS TV, FB TV, ATV, A SPOR kanalları için gerçek m3u8 stream URL'leri
- P2: TV8 stream güvenilirliği
- P2: TRT SPOR alternatif sunucu kaynakları
