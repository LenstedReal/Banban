# banbansports UNDERGROUND HD - PRD

## Proje Tanımı
Canlı spor yayını platformu. Retro-futuristik cyberpunk tasarımlı, çoklu kanal destekli, canlı skor takipli web uygulaması.

## Session 3 - 23 Nisan 2026 (Ultra Derin Tarama + Kullanıcı Talepleri)

### Testing Agent ile tespit edilen bugler (iteration_9.json)
Tüm 20 bug matrix kontrol edildi, 6 major + 3 minor düzeltildi.

### Yapılan Ana Düzeltmeler (Son session)

1. **Kanal isimleri** (DEMO → TRAILER)
   - demo1 → SİNTEL TRAILER (lokal /sintel.mp4, 4.2MB Blender Sintel trailer)
   - demo2 → TEARS OF STEEL TRAILER (TR altyazılı, unified-streaming HLS)
   - demo3 → BIG BUCK BUNNY TRAILER (EN altyazılı, lokal /demo3.mp4 5MB)
   - REKLAM kanalı kaldırıldı

2. **Pre-roll Reklam Sistemi**
   - SADECE gerçek yayınlarda (TRT, beIN), Trailerlerde yok
   - ATLAMA YOK - reklam bitince otomatik yayına geçer
   - Reklam tıklanabilir → Play Store

3. **Lig İsimleri Türkçeleştirme** (formatLeagueName() mapper)
   - Süper Lig → Trendyol Süper Lig
   - Turkiye Cup → Ziraat Türkiye Kupası
   - 1st/2nd Lig → TFF 1./2. Lig
   - Champions League → Şampiyonlar Ligi
   - Europa League → Avrupa Ligi
   - LaLiga → La Liga, Premier League → Premier Lig, vb.
   - (Turkiye) suffix'i gizlendi

4. **Lig Filtre Butonları**
   - 1. LİG ve 2. LİG kaldırıldı
   - TÜRKİYE KUPASI eklendi
   - Kalan: TÜMÜ, SÜPER LİG, TÜRKİYE KUPASI, ŞAMPİYONLAR LİGİ, SERİE A, BUNDESLIGA, LA LİGA, PREMİER LİG, LIGUE 1

5. **Penaltı Skoru Gösterimi** (p 3-1)
   - LiveScore API'sinden Trp1/Trp2 okunur
   - Scoreboard: Samsunspor 0 (p 3) - (p 1) 0 Trabzonspor
   - Match center: "0 - 0 (p 3-1)"
   - FT/AP/AET/Pen. durumlarında gösterilir

6. **Bildirim Sistemi Yeniden Yapılandırıldı**
   - SADECE maç merkezinde görünen maçlar için bildirim (window._renderedMatchKeys filter)
   - Çeşitlilik: GOL (top ikonu), SARI KART, KIRMIZI KART, PENALTI, MAÇ BAŞLADI, MAÇ YAKLAŞIYOR (30dk), DEVRE ARASI, 2.YARI, MAÇ BİTTİ (p X-Y penaltı dahil)
   - LiveScore Incs field okunur (IT=6 sarı, IT=7 kırmızı, IT=9 penaltı)
   - Chrome arka plan bildirimleri aktif (SW push event)

7. **Scoreboard Küçültme**
   - Desktop: 44px → 36px (skor)
   - 32px → 26px (separator)
   - Mobile 768px: 32px → 26px
   - Mobile 420px: 26px → 22px

8. **Team Name Overflow Fix**
   - overflow: hidden, text-overflow: ellipsis eklendi
   - Mobile clamp() fontsize artırıldı
   - max-width: 100% ayarlandı

9. **AP/AET/Pen. Status**
   - Hem scoreboard hem match center artık MAÇ SONU gösteriyor
   - AP ham gösterim yok

10. **Donma Hatası Fix (Çoklu Polling)**
    - fetchLiveScore çift interval düzeltildi (self-scheduling setTimeout chain)
    - fetchAllMatches çift poll kaldırıldı
    - WebSocket ping interval stacking düzeltildi
    - Freeze overlay çift retry önlendi
    - Preroll session cancel (kanal değişimi)

11. **Server 3 (EU)** Apple bipbop → Akamai Kopenhag CDN

12. **Sunucu yedekleri distinct** (aynı URL 2x denenmiyor)

## Kanal Stream Kaynakları
- SİNTEL: `/sintel.mp4` (lokal 4.2MB)
- TEARS OF STEEL: demo.unified-streaming.com HLS
- BIG BUCK BUNNY: `/demo3.mp4` (lokal 5MB)
- TRT 1/HABER/SPOR: medya.trt.com.tr HLS
- TV 8: daioncdn.net HLS
- beIN SPORTS 1: backend /api/bein/master.m3u8 proxy
- Sunucu 3 yedek: Akamai EU Kopenhag

## Bildirim İkonları (8 PNG)
/icons/goal.png, /icons/redcard.png, /icons/yellowcard.png, /icons/penalty.png, /icons/kickoff.png, /icons/halftime.png, /icons/fulltime.png, /icons/info.png

## Kalan İşler / Backlog (P1)
- Canlı beIN SPORTS 1 m3u8 URL (kullanıcı sağlayacak)
- S Sport m3u8 (kullanıcı sağlayacak)
- Vercel deploy (serverless API dosyaları hazır)
- app.js refactor (2023 satır → modüller)
- /app/backend/tests pytest regression dosyaları

## Test Credentials
- Hiçbir auth sistemi yok, kullanıcı bildirim izni tarayıcıdan verecek
