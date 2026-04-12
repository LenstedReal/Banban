# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Mimari
- **Frontend**: Vanilla HTML/CSS/JS (CRA public/ dizininde barındırılıyor)
- **Backend**: FastAPI (Python) - LiveScore proxy, WebSocket skor yayını, stream proxy
- **Dış API'ler**: LiveScore API (gerçek zamanlı skorlar), TheSportsDB (fallback)
- **Yayın**: HLS.js ile m3u8 stream desteği

## Yapılan İşler (12 Nisan 2026)

### Bug Fix #1: Scoreboard Race Condition
- **Sorun**: Scoreboard önce LiveScore API'den gerçek veri alıp sonra WebSocket'ten gelen default "TÜRKİYE vs ROMANYA" verisiyle üzerine yazılıyordu
- **Çözüm**: `hasLiveScoreData` flag'i eklendi. LiveScore'dan gerçek veri geldiğinde, WebSocket default verileri artık üzerine yazamıyor

### Bug Fix #2: BACKEND_URL Hardcoded Domain
- **Sorun**: app.js'deki BACKEND_URL `cyberpunk-canli-tv.preview.emergentagent.com` olarak hardcode edilmişti
- **Çözüm**: `window.location.origin` kullanılarak dinamik URL oluşturuldu

### Bug Fix #3: PUBG Mobile Reklam Videosu
- **Sorun**: REKLAM kanalı doğa manzarası videosu gösteriyordu
- **Çözüm**: Steam CDN'den PUBG F2P Launch Gameplay Trailer indirildi, 20sn klip kesildi, "PUBG MOBILE" text overlay eklendi. WebM (VP9) ve MP4 (H.264) dual format ile fallback mekanizması eklendi

### Bug Fix #4: Chrome'da Maç Merkezi
- **Sorun**: Maç Merkezi Chrome'da görünmüyordu (BACKEND_URL yanlış olduğu için API çağrıları başarısız oluyordu)
- **Çözüm**: BACKEND_URL düzeltmesiyle birlikte otomatik olarak çözüldü

## Temel Özellikler
- 14 kanal desteği (DEMO, TRT, beIN, S SPORT, vb.)
- Canlı skor tabelası (LiveScore API + WebSocket)
- Maç Merkezi (6 lig, 23+ maç kartı)
- HLS stream player (kalite seçici, ses kontrolü, tam ekran, PiP)
- Stream donma/crash algılama ve otomatik sunucu geçişi
- Sponsor bölümü
- Sunucu seçici (6 sunucu)

## Kalan İşler / Backlog
- P1: beIN SPORTS, S SPORT, GS TV, FB TV, ATV, A SPOR kanalları için gerçek m3u8 stream URL'leri
- P2: TV8 stream güvenilirliği
- P2: TRT SPOR alternatif sunucu kaynakları
