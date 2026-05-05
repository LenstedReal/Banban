# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması. Vercel'de deploy edilebilir (vercel-deploy/ klasörü hazır).

## Repo
- GitHub: https://github.com/LenstedReal/Banban
- Vercel preview: https://banbansports978.vercel.app

## Son Yapılan İşler (5 Mayıs 2026)
1. **GitHub'tan tüm proje çekildi** - önceki agent'ın sponsor logo + sp-* positioned absolute layout düzenlemesi tamamen alındı
2. **Vercel-deploy senkronize edildi**:
   - app.js, index.html /app/frontend/public/ ile aynı
   - 36 sponsor logosu logos/ klasöründe
   - icons/ + VTT subtitle dosyaları sync
3. **vercel.json güncellendi** - date param, tomorrow, image cache headers
4. **livescore.js Vercel function** - date ve day query params desteği eklendi

## Mevcut Yapı
```
/app/
├── frontend/public/
│   ├── app.js (2866 satır)
│   ├── index.html (1153 satır)
│   ├── logos/ (36 sponsor PNG)
│   ├── icons/ (8 bildirim ikonu PNG)
│   └── ad_*.mp4/.webm (oyun reklamları)
├── backend/
│   └── server.py (550 satır - FastAPI + LiveScore proxy + WebSocket)
└── vercel-deploy/  (Vercel'e bağımsız deploy için)
    ├── index.html, app.js (frontend ile sync)
    ├── api/livescore.js, api/bein-master.js (Vercel functions)
    └── vercel.json
```

## Aktif Özellikler
- ✅ HIZLI VE ÖFKELİ 11 + SPIDER-MAN: BND trailer kanalları (NEW badge ile)
- ✅ TRT 1, TRT HABER, TV 8, TRT SPOR, beIN SPORTS 1, S Sport, GS TV, FB TV, ATV, A SPOR
- ✅ Sponsor positioned-absolute layout (Meritking ortada, Heineken kırmızı yıldız, RedBull, Samsung, Vodafone, Trendyol, Pepsi vb. 36 marka)
- ✅ Maç merkezi (Süper Lig + Türkiye Kupası + Avrupa ligler, TFF 1./2.Lig HARİÇ)
- ✅ Lig isimleri Türkçe (Trendyol Süper Lig, Ziraat Türkiye Kupası, Şampiyonlar Ligi)
- ✅ Penaltı skoru (p X-Y) parantez içinde
- ✅ Scoreboard maçkolik tarzı (Beşiktaş vs Konyaspor MAÇ ÖNÜ - 20:30)
- ✅ Push notification ikonları (gol/kart/penaltı/düdük dinamik)
- ✅ EN/TR dil toggle
- ✅ Cast/AirPlay/Presentation API
- ✅ Performans: GPU acceleration, will-change, contain
- ✅ Pre-roll reklam sistemi (oyun trailerları, Play Store/App Store/Huawei/Xiaomi UA-based redirect)

## Kalan Bilinen İşler (Backlog)
- P0: Kullanıcı sintel/BBB yerine YouTube embed iframe çalışıp çalışmadığını test edecek
- P1: Sintel TRAILER (eski demo1) Vercel'de çalışıyor olabilir
- P1: Maç card'a tıklayınca Maçkolik tarzı detay modal (gol/kart/korner istatistik) - GitHub'ta var mı kontrol et
- P1: Canlı beIN SPORTS 1 m3u8 URL (kullanıcı sağlayacak)
- P1: S Sport m3u8 (kullanıcı sağlayacak)
- P2: Vercel'e push (kullanıcı GitHub'a "Save to GitHub" buton ile push edecek, sonra Vercel auto-deploy)

## Test Credentials
Auth sistemi yok.

## Performans Notları
- React DOM kullanılmıyor (vanilla JS - daha hızlı)
- 120Hz cihazlarda akıcı için: transform GPU, will-change, contain, backface-visibility hidden
- prefers-reduced-motion fallback
- iPhone 90+ FPS hedefi (refresh rate cihaza bağlı, requestAnimationFrame zaten max FPS verir)
