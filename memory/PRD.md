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
- Performans optimizasyonu (GPU, DNS prefetch, HLS config)
- Scoreboard flash/çakışma düzeltmesi (fade-in + WebSocket bloklama)
- Kanal geçiş cleanup (streamSessionId)
- **SON BÜYÜK GÜNCELLEME**:
  - Reklam isimleri doğru eşleştirildi (CoD Warzone, Civ VI)
  - eFootball 2026 gerçek Konami videosu (PEGI ekranı atlanmış)
  - Offline scoreboard (localStorage cache)
  - Türkiye-Romanya default verisi kaldırıldı
  - 15sn anlık güncelleme (60sn'den düşürüldü)
  - Maçkolik tarzı bildirim sistemi (gol, kırmızı kart, penaltı, sesli)

## Kalan İşler
- P1: S Sport m3u8 URL
- P1: beIN canlı m3u8 URL
- P1: Vercel deploy (serverless API dosyaları hazır)
