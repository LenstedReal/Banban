# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Yapılan İşler - 18 Nisan 2026

### Scoreboard AI Priority Sistemi
- Büyük Türk takımları (GS, FB, BJK, TS) en yüksek öncelik
- GS maç günlerinde GS öncelikli (kullanıcı tercihi)
- Şampiyonlar Ligi maçları da önemli maç sayılır
- Önemli maç CANLI → her zaman göster
- Önemli maç BAŞLAMADI + başka canlı maç var → 15dk önemli / 10dk canlı döngüsü

### Reklam Videoları Yenilendi
- eFootball 2026: EA SPORTS FC gameplay trailer (futbol içerikli)
- PUBG Mobile: Steam PUBG F2P trailer
- Call of Duty Mobile: CoD Warzone Season 1 trailer
- Lords Mobile: Civilization VI trailer
- Tümü 20sn, sesli, kaliteli Steam trailer'lardan

### DEMO 3 Kanalı Eklendi
- Eski eFootball videosu DEMO 3 olarak eklendi (60sn, loop)

### Vercel Deploy Altyapısı (hazır)
- `vercel-deploy/api/livescore.js` - LiveScore serverless proxy
- `vercel-deploy/api/bein-master.js` - beIN master manifest serverless
- `vercel-deploy/vercel.json` - Route rewrites

## Kalan İşler
- P1: Vercel deploy altyapısı repoya push
- P1: S Sport m3u8 URL bekleniyor
- P1: beIN canlı m3u8 URL bekleniyor
- P2: S Sport API endpoint düzeltme
