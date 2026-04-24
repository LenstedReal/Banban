    // ============================================
    // PERFORMANCE OPTIMIZATIONS (v12 Engine)
    // ============================================
    // Passive scroll listeners
    document.addEventListener('touchstart', function(){}, {passive: true});
    document.addEventListener('touchmove', function(){}, {passive: true});
    document.addEventListener('wheel', function(){}, {passive: true});
    // Reduce layout thrashing - batch DOM reads
    var _rafQueue = [];
    function batchDOM(fn) { _rafQueue.push(fn); if (_rafQueue.length === 1) requestAnimationFrame(function() { var q = _rafQueue.slice(); _rafQueue.length = 0; q.forEach(function(f){f();}); }); }
    // Image decode optimization
    if ('connection' in navigator && navigator.connection.saveData) { document.documentElement.classList.add('save-data'); }

    // ============================================
    // BACKEND URL
    // ============================================
    const BACKEND_URL = (function() {
        const h = window.location.hostname;
        // Vercel serverless: same-origin (/api/* handled by vercel.json rewrites)
        if (h.includes('vercel')) return '';
        // Local dev
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8001';
        // Preview/production: same-origin backend
        return window.location.origin;
    })();
    const IS_STATIC = !BACKEND_URL;

    // ============================================
    // STREAM SOURCES
    // ============================================
    const BEIN1_VIDEO = 'https://dt-vod-bc-hd.akamaized.net/9/13/a77b/PT_MUL_HLS_0000147902/media-4/hdntl=exp=1776074067~acl=%2f*~id=ac93227984~data=hdntl,cip%3d85.106.115.121,app%3d241,c%3d8,aid%3dPT_MUL_HLS_0000147902~hmac=e3d50aa750c03c0325ee4346439794ee6b5f482879e20144442c7df9a8cefe81/stream.m3u8';
    const BEIN1_AUDIO = 'https://dt-vod-bc-hd.akamaized.net/9/13/a77b/PT_MUL_HLS_0000147902/audio/aac/tur/hdntl=exp=1776074984~acl=%2f*~id=ac93227984~data=hdntl,cip%3d85.106.115.121,app%3d241,c%3d8,aid%3dPT_MUL_HLS_0000147902~hmac=a0c8cd40a968b7a4f2df26b031b8a1ae6d4ae071ba43453a9703ecf912dd0987/stream.m3u8';

    // Master manifest'i tarayıcıda blob URL olarak oluştur (backend gerektirmez)
    function createBeinMasterUrl() {
        var manifest = '#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-INDEPENDENT-SEGMENTS\n\n' +
            '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Turkish",LANGUAGE="tur",DEFAULT=YES,AUTOSELECT=YES,URI="' + BEIN1_AUDIO + '"\n\n' +
            '#EXT-X-STREAM-INF:BANDWIDTH=4000000,AUDIO="audio"\n' + BEIN1_VIDEO;
        var blob = new Blob([manifest], {type: 'application/vnd.apple.mpegurl'});
        return URL.createObjectURL(blob);
    }

    const STREAMS = {
        // TRAILER yayınları - LOKAL dosyalar (Chrome ERR_ABORTED'i önlemek için)
        sintel_mp4: '/sintel.mp4',           // 4.2MB local Blender Sintel trailer
        big_buck_bunny_mp4: '/demo3.mp4',    // 5MB local BBB video
        // Tears of Steel HLS (unified-streaming - çalışıyor)
        tears_of_steel: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        // Mux HLS fallback
        mux_test: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        trt1: 'https://tv-trt1.medya.trt.com.tr/master.m3u8',
        trthaber: 'https://tv-trthaber.medya.trt.com.tr/master.m3u8',
        trtspor: 'https://tv-trtspor1.medya.trt.com.tr/master.m3u8',
        tv8: 'https://tv8.daioncdn.net/tv8/tv8.m3u8?app=7ddc255a-ef47-4e81-ab14-c0e5f2949788&ce=3',
        akamai_eu: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
        bein1_video: BEIN1_VIDEO,
        bein1: (BACKEND_URL || '') + '/api/bein/master.m3u8?video=' + encodeURIComponent(BEIN1_VIDEO) + '&audio=' + encodeURIComponent(BEIN1_AUDIO)
    };

    // Sunucu yedekleri - Sunucu 1, 2 ve 3 hepsi aynı primary stream (kullanıcı talebi)
    // Server 3 artık "bip bop" test ekranı göstermiyor, Server 2 ile aynı yayını veriyor.
    const SERVER_ALTERNATIVES = {
        demo1: [STREAMS.sintel_mp4, STREAMS.sintel_mp4, STREAMS.sintel_mp4],
        demo2: [STREAMS.tears_of_steel, STREAMS.tears_of_steel, STREAMS.tears_of_steel],
        demo3: [STREAMS.big_buck_bunny_mp4, STREAMS.big_buck_bunny_mp4, STREAMS.big_buck_bunny_mp4],
        trt1: [STREAMS.trt1, STREAMS.trt1, STREAMS.trt1],
        trthaber: [STREAMS.trthaber, STREAMS.trthaber, STREAMS.trthaber],
        trtspor: [STREAMS.trtspor, STREAMS.trtspor, STREAMS.trtspor],
        tv8: [STREAMS.tv8, STREAMS.tv8, STREAMS.tv8],
        bein1: [STREAMS.bein1, STREAMS.bein1, STREAMS.bein1]
    };

    // ============================================
    // REKLAM SİSTEMİ - 5 Farklı Video (HEPSİ MOBİL OYUN)
    // ============================================
    var ADS = [
        { name: 'PUBG MOBILE', url: 'https://play.google.com/store/apps/details?id=com.tencent.ig', color: '#FF6600', vid: 'ad_pubg' },
        { name: 'eFootball', url: 'https://play.google.com/store/apps/details?id=jp.konami.pesam', color: '#0066FF', vid: 'ad_efootball' },
        { name: 'Standoff 2', url: 'https://play.google.com/store/apps/details?id=com.axlebolt.standoff2', color: '#00CC66', vid: 'ad_efcrossover' },
        { name: 'Call of Duty Mobile', url: 'https://play.google.com/store/apps/details?id=com.activision.callofduty.shooter', color: '#00CC44', vid: 'ad_cod' },
        { name: 'Lords Mobile', url: 'https://play.google.com/store/apps/details?id=com.igg.android.lordsmobile', color: '#CC0000', vid: 'ad_lords' }
    ];
    function shuffleAds(){var a=ADS.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}sessionStorage.setItem('bb_ads',JSON.stringify(a));sessionStorage.setItem('bb_adi','0');sessionStorage.setItem('bb_adv','5_'+ADS.map(function(x){return x.name;}).join('|'));return a;}
    function getAds(){var expected='5_'+ADS.map(function(x){return x.name;}).join('|');var v=sessionStorage.getItem('bb_adv');if(v!==expected){return shuffleAds();}var s=sessionStorage.getItem('bb_ads');return s?JSON.parse(s):shuffleAds();}
    function getAd(){var ads=getAds();var i=parseInt(sessionStorage.getItem('bb_adi')||'0');if(i>=ads.length)i=0;return ads[i];}
    function nextAd(){var ads=getAds();var i=parseInt(sessionStorage.getItem('bb_adi')||'0')+1;if(i>=ads.length)i=0;sessionStorage.setItem('bb_adi',String(i));}

    const CHANNELS = {
        fastx: { name: 'HIZLI VE ÖFKELİ 11', status: 'online', isTrailer: true, isComingSoon: true, comingText: 'FRAGMAN YAKINDA', isNew: true },
        spiderman: { name: 'SPIDER-MAN: BRAND NEW DAY', status: 'online', isTrailer: true, isLocalTrailer: true, localUrl: '/spiderman_trailer.mp4', isNew: true },
        trt1: { name: 'TRT 1', status: 'online', stream: STREAMS.trt1 },
        trthaber: { name: 'TRT HABER', status: 'online', stream: STREAMS.trthaber },
        tv8: { name: 'TV 8', status: 'online', stream: STREAMS.tv8 },
        trtspor: { name: 'TRT SPOR', status: 'checking', stream: STREAMS.trtspor },
        bein1: { name: 'beIN SPORTS 1', status: 'online', stream: STREAMS.bein1 },
        bein2: { name: 'beIN SPORTS 2', status: 'maintenance', premium: true },
        ssport: { name: 'S SPORT', status: 'maintenance', premium: true },
        gstv: { name: 'GS TV', status: 'maintenance' },
        fbtv: { name: 'FB TV', status: 'maintenance' },
        atv: { name: 'ATV', status: 'maintenance' },
        aspor: { name: 'A SPOR', status: 'maintenance' }
    };
    let currentChannel = 'fastx';

    const SPORTS_API = 'https://www.thesportsdb.com/api/v1/json/3';

    // ============================================
    // STATE
    // ============================================
    let currentServerIndex = 0;
    let hls = null;
    let isPlaying = false;
    let isMuted = true;
    let ws = null;
    let wsReconnectAttempts = 0;
    let retryCount = 0;
    let stallCount = 0;
    let crashCheckInterval = null;
    let lastPlaybackTime = 0;
    let httpPollingInterval = null;
    let qualityMenuOpen = false;
    let hasLiveScoreData = false; // LiveScore API'den gerçek veri geldi mi?
    let liveScoreChecked = false; // LiveScore API ilk kez çağrıldı mı?
    let lastNotifiedStatus = ''; // Son bildirim gönderilen maç durumu
    let notificationsEnabled = false; // Bildirim izni var mı?

    const video = document.getElementById('video');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorOverlay = document.getElementById('errorOverlay');
    const maintenanceOverlay = document.getElementById('maintenanceOverlay');
    const unmuteBtn = document.getElementById('unmuteBtn');
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const matchMinute = document.getElementById('matchMinute');

    // ============================================
    // WEBSOCKET
    // ============================================
    var wsPingInterval = null;
    
    function connectWebSocket() {
        if (IS_STATIC || !BACKEND_URL) { startHttpPolling(); return; }
        if (ws && ws.readyState === WebSocket.OPEN) return;
        
        const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/ws/scores';
        try { ws = new WebSocket(wsUrl); } catch(e) { startHttpPolling(); return; }
        
        ws.onopen = () => {
            wsReconnectAttempts = 0;
            // Eski ping interval'i temizle (stack'lenme önlenir)
            if (wsPingInterval) clearInterval(wsPingInterval);
            wsPingInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) { try { ws.send('ping'); } catch(e) {} }
            }, 25000);
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'score_update') {
                    if (!liveScoreChecked || hasLiveScoreData) return;
                    updateScoreboard(data);
                }
            } catch (e) {}
        };
        ws.onclose = () => {
            ws = null;
            if (wsPingInterval) { clearInterval(wsPingInterval); wsPingInterval = null; }
            if (wsReconnectAttempts < 5) { wsReconnectAttempts++; setTimeout(connectWebSocket, 3000); }
            else startHttpPolling();
        };
        ws.onerror = () => {};
    }

    function startHttpPolling() {
        if (httpPollingInterval) return;
        // setInterval yerine self-scheduling setTimeout kullan (önceki çağrı bitmeden yenisi başlamasın)
        function poll() {
            fetchLiveScore().finally(function() {
                httpPollingInterval = setTimeout(poll, 15000);
            });
        }
        poll();
    }

    // ============================================
    // LIVE SCORE
    // ============================================
    const turkishTeams = ['Galatasaray', 'Fenerbahce', 'Fenerbah', 'Besiktas', 'Be\u015fikta\u015f',
        'Trabzonspor', 'Istanbul', '\u0130stanbul', 'Kasimpasa', 'Kas\u0131mpa\u015fa',
        'Samsunspor', 'Antalyaspor', 'Konyaspor', 'Sivasspor', 'Rizespor',
        'Alanyaspor', 'Kayserispor', 'Gaziantep', 'Hatayspor', 'Adana',
        'Goztepe', 'G\u00f6ztep', 'Ey\u00fcpspor', 'Pendikspor', 'Bodrum', 'Turkey', 'T\u00fcrkiye'];
    
    function isTurkish(name) {
        const n = name.toLowerCase();
        return turkishTeams.some(t => n.includes(t.toLowerCase()));
    }

    function getStatus(event) {
        const s = event.strStatus || event.strProgress || '';
        if (s.includes('HT') || s === 'Halftime') return 'DEVRE ARASI';
        if (s.includes('FT') || s === 'Match Finished') return 'MAÇ SONU';
        if (s.includes("'") || s.includes('min')) return s;
        if (s === '1H') return '1. YARI';
        if (s === '2H') return '2. YARI';
        if (s === 'NS' || s === 'Not Started') return 'BAŞLAMADI';
        const m = s.match(/(\d+)/);
        if (m) return m[1] + "'";
        return 'CANLI';
    }

    // Lig adı Türkçeleştirici (LiveScore API'den gelen Snm + Cnm'yi düzgün Türkçe göster)
    function formatLeagueName(snm, cnm) {
        var s = (snm || '').trim();
        var c = (cnm || '').trim();
        // Özel eşlemeler (Türkiye ligleri)
        var turkishMap = {
            'Süper Lig': 'Trendyol Süper Lig',
            '1st Lig': 'TFF 1. Lig',
            '1. Lig': 'TFF 1. Lig',
            '2nd Lig': 'TFF 2. Lig',
            '2nd Lig: White Group': 'TFF 2. Lig Beyaz Grup',
            '2nd Lig: Red Group': 'TFF 2. Lig Kırmızı Grup',
            '2. Lig': 'TFF 2. Lig',
            'Turkiye Cup': 'Ziraat Türkiye Kupası',
            'Türkiye Cup': 'Ziraat Türkiye Kupası',
            'Turkiye Cup: Final Stage': 'Ziraat Türkiye Kupası',
            'Turkish Cup': 'Ziraat Türkiye Kupası',
            'Super Cup': 'Türkiye Süper Kupası'
        };
        // Avrupa/Dünya ligleri
        var globalMap = {
            'LaLiga': 'La Liga',
            'La Liga': 'La Liga',
            'Premier League': 'Premier Lig',
            'Bundesliga': 'Bundesliga',
            'Serie A': 'Serie A',
            'Ligue 1': 'Ligue 1',
            'UEFA Champions League': 'Şampiyonlar Ligi',
            'Champions League': 'Şampiyonlar Ligi',
            'UEFA Europa League': 'Avrupa Ligi',
            'Europa League': 'Avrupa Ligi',
            'UEFA Conference League': 'Konferans Ligi',
            'Conference League': 'Konferans Ligi',
            'UEFA Nations League': 'Uluslar Ligi',
            'Nations League': 'Uluslar Ligi',
            'World Cup': 'Dünya Kupası',
            'Euro': 'Avrupa Şampiyonası',
            'European Championship': 'Avrupa Şampiyonası'
        };
        // Önce özel Türk eşlemesi
        if (turkishMap[s]) return turkishMap[s];
        // Sonra global eşleme
        if (globalMap[s]) return globalMap[s];
        // (Turkiye), (Spain), (England) gibi son ekleri gizle
        if (c && c.toLowerCase() !== 'world' && c.toLowerCase() !== 'international') {
            // Türkiye ise Cnm yazma
            if (/turk/i.test(c)) return s;
            return s + ' (' + c + ')';
        }
        return s;
    }

    // Scoreboard döngü state'i
    var scoreboardImportantMatch = null;
    var scoreboardLiveMatch = null;
    var scoreboardShowingImportant = true;
    var scoreboardCycleTimer = 0;
    var CYCLE_IMPORTANT_DURATION = 900;
    var CYCLE_LIVE_DURATION = 600;
    var bigClubs = ['galatasaray','fenerbah','besiktas','beşiktaş','trabzonspor'];
    
    // Yarınki önemli Türk maçı cache'i (MAÇ SONU kalıcılığından çıkmak için)
    var tomorrowTurkishMatch = null;
    var tomorrowFetchInProgress = false;
    var tomorrowLastFetch = 0;
    
    // === OFFLINE CACHE: Son maç verisini localStorage'da tut ===
    function cacheScoreboard(match) {
        try { localStorage.setItem('bb_last_match', JSON.stringify(match)); } catch(e) {}
    }
    function getCachedScoreboard() {
        try { var s = localStorage.getItem('bb_last_match'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
    }
    // Sayfa açılırken cache'den yükle (internet gelmeden önce)
    var cached = getCachedScoreboard();
    if (cached) {
        setTimeout(function() { if (!hasLiveScoreData) updateScoreboard(cached); }, 500);
    }

    // === MAÇKOLİK TARZI BİLDİRİM SİSTEMİ ===
    var lastMatchEvents = {}; // {matchKey: {goals: n, reds: n, yellows: n, pens: n}}
    
    function checkMatchEvents(stages) {
        if (!notificationsEnabled) return;
        
        // Sadece MAÇ MERKEZİNDE gösterilen maçlar için bildirim gönder
        var renderedKeys = window._renderedMatchKeys || {};
        
        for (var i = 0; i < stages.length; i++) {
            var stg = stages[i], cn = (stg.Cnm||'').toLowerCase(), sn = (stg.Snm||'').toLowerCase();
            var evts = stg.Events || [];
            for (var j = 0; j < evts.length; j++) {
                var ev = evts[j];
                var t1 = ((ev.T1||[{}])[0].Nm||''), t2 = ((ev.T2||[{}])[0].Nm||'');
                var key = t1 + '-' + t2;
                
                // SADECE maç merkezinde render edilen maçlar için bildirim (kullanıcı isteği)
                if (!renderedKeys[key]) continue;
                
                var eps = ev.Eps || 'NS';
                var isLive = eps.includes("'") || eps === '1H' || eps === '2H' || eps === 'HT';
                
                var s1 = ev.Tr1 || 0, s2 = ev.Tr2 || 0;
                var prev = lastMatchEvents[key];
                var totalGoals = s1 + s2;
                
                // Maç 30dk sonra başlıyor bildirimi
                if (eps === 'NS' && ev.Esd) {
                    var mt = String(ev.Esd).substring(8,10) + ':' + String(ev.Esd).substring(10,12);
                    var mh = parseInt(mt.substring(0,2)) + 6;
                    if (mh >= 24) mh -= 24;
                    var now = new Date();
                    var matchMin = mh * 60 + parseInt(mt.substring(3));
                    var nowMin = now.getHours() * 60 + now.getMinutes();
                    var diff = matchMin - nowMin;
                    var preKey = key + '-pre';
                    if (diff > 0 && diff <= 30 && !lastMatchEvents[preKey]) {
                        lastMatchEvents[preKey] = true;
                        sendMatchAlert('MAÇ YAKLAŞIYOR', t1 + ' vs ' + t2 + ' - ' + diff + ' dakika sonra başlıyor!', 'info');
                    }
                }
                
                if (!isLive) {
                    // Maç bitti bildirimi (önceden canlıydı)
                    if ((eps === 'FT' || eps === 'AP' || eps === 'AET' || eps === 'Pen.') && prev && prev.status !== 'FT' && prev.status !== 'AP') {
                        var penStr = '';
                        if (ev.Trp1 !== undefined && ev.Trp2 !== undefined) penStr = ' (p ' + ev.Trp1 + '-' + ev.Trp2 + ')';
                        sendMatchAlert('MAÇ BİTTİ', t1 + ' ' + s1 + ' - ' + s2 + penStr + ' ' + t2, 'fulltime');
                        lastMatchEvents[key] = { goals: totalGoals, status: 'FT', s1: s1, s2: s2, incs: (prev.incs||0) };
                    }
                    continue;
                }
                
                if (!prev) {
                    // Maç yeni başladı bildirimi
                    lastMatchEvents[key] = { goals: totalGoals, status: eps, s1: s1, s2: s2, incs: (ev.Incs||[]).length };
                    sendMatchAlert('MAÇ BAŞLADI!', t1 + ' vs ' + t2, 'kickoff');
                    continue;
                }
                
                // GOL - doğru skor farkından gol atan takımı bul
                if (totalGoals > prev.goals) {
                    var ds1 = s1 - (prev.s1 || 0);
                    var ds2 = s2 - (prev.s2 || 0);
                    var goalTeam = ds1 > ds2 ? t1 : t2;
                    sendMatchAlert('GOL!', goalTeam + '! ' + t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2 + ' (' + eps + ')', 'goal');
                }
                
                // KIRMIZI/SARI KART/PENALTI (LiveScore Incs field'ı - IT=4:gol, 6:sarı, 7:kırmızı, 9:penaltı)
                var incs = ev.Incs || [];
                var prevIncsLen = prev.incs || 0;
                if (incs.length > prevIncsLen) {
                    for (var k = prevIncsLen; k < incs.length; k++) {
                        var inc = incs[k];
                        var it = inc.IT;
                        var player = inc.P1 || '';
                        var min = inc.Min || inc.Mn || '';
                        // Hangi takım? (Nm1=home, Nm2=away convention'a göre veya IT'in içinde team info)
                        var team = inc.Nm === '2' || inc.T === 2 ? t2 : t1;
                        if (it === 6 || it === 'YC' || it === 'Y') {
                            sendMatchAlert('SARI KART', (min?min+"' ":'') + team + ' - ' + (player||'Oyuncu') + ' sarı kart gördü', 'yellowcard');
                        } else if (it === 7 || it === 'RC' || it === 'R') {
                            sendMatchAlert('KIRMIZI KART!', (min?min+"' ":'') + team + ' - ' + (player||'Oyuncu') + ' kırmızı kart gördü!', 'redcard');
                        } else if (it === 9 || it === 'PEN' || it === 'P') {
                            sendMatchAlert('PENALTI!', (min?min+"' ":'') + team + ' lehine penaltı!', 'penalty');
                        }
                    }
                }
                
                // DEVRE ARASI
                if (eps === 'HT' && prev.status !== 'HT') {
                    sendMatchAlert('DEVRE ARASI', t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2, 'halftime');
                }
                
                // 2. YARI BAŞLADI
                if (eps === '2H' && prev.status !== '2H' && prev.status === 'HT') {
                    sendMatchAlert('2. YARI BAŞLADI', t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2, 'kickoff');
                }
                
                lastMatchEvents[key] = { goals: totalGoals, status: eps, s1: s1, s2: s2, incs: incs.length };
            }
        }
    }

    function sendMatchAlert(title, body, type) {
        // 1. EKRAN BİLDİRİMİ (Maçkolik tarzı - ekranın üstünden kayarak gelir)
        showInAppNotification(title, body, type);
        
        // 2. SESLİ BİLDİRİM
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            if (type === 'goal') {
                osc.frequency.value = 880; gain.gain.value = 0.3;
                osc.start(); osc.stop(ctx.currentTime + 0.15);
                setTimeout(function() {
                    var o2 = ctx.createOscillator(); o2.connect(gain); o2.frequency.value = 1100;
                    o2.start(); o2.stop(ctx.currentTime + 0.2);
                }, 200);
            } else if (type === 'redcard') {
                osc.frequency.value = 440; gain.gain.value = 0.2;
                osc.start(); osc.stop(ctx.currentTime + 0.5);
            } else {
                osc.frequency.value = 660; gain.gain.value = 0.2;
                osc.start(); osc.stop(ctx.currentTime + 0.3);
            }
        } catch(e) {}
        
        // 3. PUSH NOTIFICATION (tarayıcı bildirimi)
        sendNotification(title, body, type);
    }

    // ============================================
    // MAÇKOLİK TARZI EKRAN BİLDİRİMİ
    // ============================================
    var notifQueue = [];
    var notifShowing = false;

    function showInAppNotification(title, body, type) {
        notifQueue.push({title: title, body: body, type: type});
        if (!notifShowing) processNotifQueue();
    }

    function processNotifQueue() {
        if (notifQueue.length === 0) { notifShowing = false; return; }
        notifShowing = true;
        try {
            _renderNotifBanner(notifQueue.shift());
        } catch(e) {
            notifShowing = false;
            // Queue stuck olmasın - 100ms sonra devam
            setTimeout(processNotifQueue, 100);
        }
    }

    function _renderNotifBanner(item) {
        var accentColor = {goal:'#00ff88', redcard:'#ff0040', yellowcard:'#FFD700', penalty:'#00d4ff', kickoff:'#00d4ff', halftime:'#ff9900', fulltime:'#aaaaaa', info:'#00d4ff'}[item.type] || '#00d4ff';

        // İkonlar
        var iconSvg = '';
        if (item.type === 'goal') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#00ff88" stroke-width="1.5"/><polygon points="12,3 13.5,8 18.5,8 14.5,11.5 16,17 12,13.5 8,17 9.5,11.5 5.5,8 10.5,8" fill="#00ff88"/></svg>';
        } else if (item.type === 'redcard') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" fill="#ff0040" stroke="#ff4070" stroke-width="0.5"/></svg>';
        } else if (item.type === 'yellowcard') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" fill="#FFD700" stroke="#FFA500" stroke-width="0.5"/></svg>';
        } else if (item.type === 'penalty') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="2" fill="#00d4ff"/><rect x="3" y="4" width="2" height="14" fill="#00d4ff"/><rect x="19" y="4" width="2" height="14" fill="#00d4ff"/><circle cx="12" cy="14" r="3" fill="none" stroke="#00d4ff" stroke-width="1.5"/></svg>';
        } else if (item.type === 'kickoff') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#00d4ff" stroke-width="1.5"/><path d="M8 12l3-3v6z" fill="#00d4ff"/></svg>';
        } else if (item.type === 'halftime') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#ff9900" stroke-width="1.5"/><rect x="9" y="7" width="2" height="10" fill="#ff9900"/><rect x="13" y="7" width="2" height="10" fill="#ff9900"/></svg>';
        } else if (item.type === 'fulltime') {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#aaa" stroke-width="1.5"/><rect x="8" y="8" width="8" height="8" rx="1" fill="#aaa"/></svg>';
        } else {
            iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#00d4ff" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#00d4ff"/></svg>';
        }

        var banner = document.createElement('div');
        banner.className = 'match-notif-banner';
        banner.style.cssText = 'position:fixed;top:-80px;left:50%;transform:translateX(-50%);z-index:99999;' +
            'width:90%;max-width:380px;padding:10px 14px;border-radius:12px;' +
            'background:rgba(15,15,25,0.95);border:1px solid ' + accentColor + '50;' +
            'box-shadow:0 4px 20px rgba(0,0,0,0.6);' +
            'display:flex;align-items:center;gap:10px;cursor:pointer;' +
            'transition:top 0.4s cubic-bezier(0.34,1.56,0.64,1);' +
            'font-family:VT323,monospace;backdrop-filter:blur(10px);';

        var dot = '<div style="flex-shrink:0;display:flex;align-items:center;">' + iconSvg + '</div>';
        
        banner.innerHTML = dot +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;color:' + accentColor + ';letter-spacing:1px;">' + item.title + '</div>' +
            '<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + item.body + '</div>' +
            '</div>';

        document.body.appendChild(banner);
        setTimeout(function() { banner.style.top = '12px'; }, 50);

        // Gol/kırmızı kart için hafif ekran flash
        if (item.type === 'goal' || item.type === 'redcard') {
            var flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99998;' +
                'background:' + accentColor + '15;pointer-events:none;animation:goalFlash 0.5s ease-out forwards;';
            document.body.appendChild(flash);
            setTimeout(function() { flash.remove(); }, 500);
        }

        setTimeout(function() {
            banner.style.top = '-80px';
            setTimeout(function() { banner.remove(); processNotifQueue(); }, 400);
        }, 4000);

        banner.onclick = function() {
            window.focus();
            banner.style.top = '-80px';
            setTimeout(function() { banner.remove(); processNotifQueue(); }, 300);
        };
    }

    // Yarınki en önemli Türk maçını getir (MAÇ SONU'nda takılı kalmamak için)
    async function fetchTomorrowTurkishMatch() {
        // 10 dakikada bir yenile, aynı anda çoklu istek yapma
        var now = Date.now();
        if (tomorrowFetchInProgress) return tomorrowTurkishMatch;
        if (tomorrowTurkishMatch && (now - tomorrowLastFetch) < 600000) return tomorrowTurkishMatch;
        
        tomorrowFetchInProgress = true;
        try {
            var tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            var tmrStr = tmr.getFullYear() + String(tmr.getMonth()+1).padStart(2,'0') + String(tmr.getDate()).padStart(2,'0');
            var resp = await fetch((BACKEND_URL || '') + '/api/livescore/date/' + tmrStr);
            if (!resp.ok) { tomorrowFetchInProgress = false; return null; }
            var data = await resp.json();
            var stages = data.Stages || [];
            
            var bigMatch = null, bigPrio = 0;
            var turkMatch = null, turkPrio = 0;
            
            for (var i = 0; i < stages.length; i++) {
                var stg = stages[i], cn = (stg.Cnm||'').toLowerCase(), sn = (stg.Snm||'').toLowerCase();
                var isTurkL = cn.includes('turk') || cn.includes('türk');
                var evts = stg.Events || [];
                for (var j = 0; j < evts.length; j++) {
                    var ev = evts[j];
                    var t1 = ((ev.T1||[{}])[0].Nm||''), t2 = ((ev.T2||[{}])[0].Nm||'');
                    var isTM = isTurkL || turkishTeams.some(function(t){return t1.toLowerCase().includes(t.toLowerCase())||t2.toLowerCase().includes(t.toLowerCase());});
                    var isBigClub = bigClubs.some(function(t){return t1.toLowerCase().includes(t)||t2.toLowerCase().includes(t);});
                    if (!isTM) continue;
                    
                    var mt = ev.Esd ? String(ev.Esd).substring(8,10)+':'+String(ev.Esd).substring(10,12) : '';
                    var timeStr = 'YARIN';
                    if (mt) { var h = parseInt(mt.substring(0,2))+6; if(h>=24)h-=24; timeStr = 'YARIN ' + String(h).padStart(2,'0') + ':' + mt.substring(3); }
                    
                    var obj = {
                        team1: t1, team2: t2,
                        score1: 0, score2: 0,
                        league: formatLeagueName(stg.Snm, stg.Cnm),
                        status: timeStr,
                        isLive: false,
                        isTomorrow: true
                    };
                    
                    if (isBigClub) {
                        var sc = 100;
                        if (sc > bigPrio) { bigPrio = sc; bigMatch = obj; }
                    }
                    if (turkPrio === 0) { turkPrio = 1; turkMatch = obj; }
                }
            }
            
            tomorrowTurkishMatch = bigMatch || turkMatch;
            tomorrowLastFetch = now;
        } catch(e) {
            console.log('Yarınki maç fetch hatası:', e);
        }
        tomorrowFetchInProgress = false;
        return tomorrowTurkishMatch;
    }

    async function fetchLiveScore() {
        try {
            var resp = await fetch((BACKEND_URL || '') + '/api/livescore/today');
            if (resp.ok) {
                var data = await resp.json();
                var stages = data.Stages || [];
                var turkTeams = ['galatasaray','fenerbah','besiktas','beşiktaş','trabzonspor','kocaelispor','samsunspor','antalyaspor','alanyaspor','kayserispor','kasımpaşa','sivasspor','turkey','türkiye','istanbul','göztepe','eyüp','adana','karagümrük','karagumruk','gençlerbirliği','başakşehir','hatayspor','pendik','bodrum','sakaryaspor'];
                var bigKeys = ['champions league','europa league','süper lig','super lig','1st lig','premier league','la liga','laliga','serie a','bundesliga','ligue 1'];
                
                var importantMatch = null; // Büyük Türk takım maçı (GS, FB, BJK, TS)
                var importantPrio = 0;
                var liveTurkMatch = null;  // Canlı oynanan herhangi bir Türk maçı
                var liveTurkPrio = 0;
                var bigLeagueMatch = null; // Büyük lig maçı (fallback)
                var bigLeaguePrio = 0;

                for (var i = 0; i < stages.length; i++) {
                    var stg = stages[i], cn = stg.Cnm||'', sn = stg.Snm||'', cl = cn.toLowerCase(), sl = sn.toLowerCase();
                    var isTurkL = cl.includes('turk') || cl.includes('türk');
                    var isBigL = bigKeys.some(function(k){return (sl+' '+cl).includes(k);});
                    if ((sl+' '+cl).includes('caf') || cl.includes('asia') || (sl+' '+cl).includes('concacaf')) isBigL = false;
                    var evts = stg.Events||[];
                    for (var j = 0; j < evts.length; j++) {
                        var ev = evts[j];
                        var t1 = ((ev.T1||[{}])[0].Nm||''), t2 = ((ev.T2||[{}])[0].Nm||'');
                        var isTM = isTurkL || turkTeams.some(function(t){return t1.toLowerCase().includes(t)||t2.toLowerCase().includes(t);});
                        var isBigClub = bigClubs.some(function(t){return t1.toLowerCase().includes(t)||t2.toLowerCase().includes(t);});
                        var eps = ev.Eps||'NS', p = 0, st = 'BAŞLAMADI';
                        var isLive = false;
                        if (eps.includes("'")||eps==='1H'||eps==='2H') {p=3;st=eps;isLive=true;} else if (eps==='HT') {p=3;st='DEVRE ARASI';isLive=true;} else if (eps==='FT'||eps==='AP'||eps==='AET'||eps==='Pen.') {p=1;st='MAÇ SONU';} else if (eps==='NS') {p=2;var mt=ev.Esd?String(ev.Esd).substring(8,10)+':'+String(ev.Esd).substring(10,12):'';if(mt){var h=parseInt(mt.substring(0,2))+6;if(h>=24)h-=24;st='MAÇ ÖNÜ - '+String(h).padStart(2,'0')+':'+mt.substring(3);}} else if (eps==='ET'||eps==='EP') {p=3;st='UZATMA';isLive=true;} else {p=2;st=eps;}
                        var sc = p*100 + (ev.Tr1||0) + (ev.Tr2||0);
                        var obj = {team1:t1||'---',team2:t2||'---',score1:ev.Tr1||0,score2:ev.Tr2||0,league:formatLeagueName(sn,cn),status:st,isLive:isLive,pen1:ev.Trp1,pen2:ev.Trp2};
                        
                        // Büyük Türk takım maçı (GS, FB, BJK, TS) - EN ÖNEMLİ
                        if (isBigClub && sc > importantPrio) { importantPrio=sc; importantMatch=obj; }
                        // Canlı oynanan Türk maçı (herhangi)
                        if (isTM && isLive && sc > liveTurkPrio) { liveTurkPrio=sc; liveTurkMatch=obj; }
                        // Büyük lig maçı fallback
                        if (isBigL && sc > bigLeaguePrio) { bigLeaguePrio=sc; bigLeagueMatch=obj; }
                    }
                }
                
                scoreboardImportantMatch = importantMatch;
                scoreboardLiveMatch = liveTurkMatch;
                
                if (importantMatch || liveTurkMatch || bigLeagueMatch) {
                    hasLiveScoreData = true;
                    liveScoreChecked = true;
                    
                    checkMatchEvents(stages);
                    
                    var impFinished = importantMatch && (importantMatch.status === 'MAÇ SONU' || importantMatch.status === 'FT');
                    
                    // 1. Önemli maç CANLI → her zaman göster
                    if (importantMatch && importantMatch.isLive) {
                        cacheScoreboard(importantMatch);
                        updateScoreboard(importantMatch);
                        return;
                    }
                    
                    // 2. Önemli maç BİTTİ + canlı Türk maçı var → canlı maça geç
                    if (impFinished && liveTurkMatch) {
                        cacheScoreboard(liveTurkMatch);
                        updateScoreboard(liveTurkMatch);
                        return;
                    }
                    
                    // 3. Önemli maç BİTTİ + canlı Türk maçı yok → yarınki en önemli Türk maçına geç
                    if (impFinished && !liveTurkMatch) {
                        // Module-level timer (localStorage yerine) - session reset edildiğinde yeniden başlar
                        var matchKey = (importantMatch.team1 || '') + '-' + (importantMatch.team2 || '');
                        if (!window._ftTimestamps) window._ftTimestamps = {};
                        if (!window._ftTimestamps[matchKey]) window._ftTimestamps[matchKey] = Date.now();
                        var elapsed = Date.now() - window._ftTimestamps[matchKey];
                        // İlk 5 dakika biten maç sonucu göster
                        if (elapsed < 5 * 60 * 1000) {
                            cacheScoreboard(importantMatch);
                            updateScoreboard(importantMatch);
                            return;
                        }
                        // 5dk sonra yarınki Türk maçına geç
                        var tmr = await fetchTomorrowTurkishMatch();
                        if (tmr) {
                            cacheScoreboard(tmr);
                            updateScoreboard(tmr);
                            return;
                        }
                        // Yarın Türk maçı yoksa bigLeague fallback
                        if (bigLeagueMatch) {
                            cacheScoreboard(bigLeagueMatch);
                            updateScoreboard(bigLeagueMatch);
                            return;
                        }
                        // Hiçbir alternatif yoksa biten maçı göster
                        cacheScoreboard(importantMatch);
                        updateScoreboard(importantMatch);
                        return;
                    }
                    
                    // 4. Önemli maç BAŞLAMADI + canlı Türk maçı var → döngü
                    if (importantMatch && liveTurkMatch && !importantMatch.isLive) {
                        scoreboardCycleTimer++;
                        if (scoreboardShowingImportant) {
                            if (scoreboardCycleTimer > CYCLE_IMPORTANT_DURATION / 60) {
                                scoreboardShowingImportant = false;
                                scoreboardCycleTimer = 0;
                            }
                            cacheScoreboard(importantMatch);
                            updateScoreboard(importantMatch);
                        } else {
                            if (scoreboardCycleTimer > CYCLE_LIVE_DURATION / 60) {
                                scoreboardShowingImportant = true;
                                scoreboardCycleTimer = 0;
                            }
                            cacheScoreboard(liveTurkMatch);
                            updateScoreboard(liveTurkMatch);
                        }
                        return;
                    }
                    
                    // 5. Sadece önemli maç (başlamadı)
                    if (importantMatch) { cacheScoreboard(importantMatch); updateScoreboard(importantMatch); return; }
                    // 6. Sadece canlı Türk maçı
                    if (liveTurkMatch) { cacheScoreboard(liveTurkMatch); updateScoreboard(liveTurkMatch); return; }
                    // 7. Büyük lig fallback
                    if (bigLeagueMatch) { cacheScoreboard(bigLeagueMatch); updateScoreboard(bigLeagueMatch); return; }
                }
            }
        } catch(e){console.log('LiveScore API hatası:',e);}
        try{if(BACKEND_URL){var r=await fetch(BACKEND_URL+'/api/scores/live');if(r.ok){updateScoreboard(await r.json());liveScoreChecked=true;return;}}}catch(e){}
        liveScoreChecked=true;
        showDefaultMatch();
    }

    function showDefaultMatch() {
        // Önce cache'den yükle, yoksa son maç verisi göster
        var cached = getCachedScoreboard();
        if (cached) {
            updateScoreboard(cached);
        }
        // Cache de yoksa boş bırak (Türkiye-Romanya gösterme)
    }

    function updateScoreboard(match) {
        document.getElementById('team1').textContent = match.team1 || '---';
        document.getElementById('team2').textContent = match.team2 || '---';
        
        const status = match.status || 'CANLI';
        const isPreMatch = status.includes('MAÇ ÖNÜ') || status === 'BAŞLAMADI' || status.includes('SONRAKİ');
        
        // Penaltı skoru parantez içinde göster (Eps=FT + Trp1/Trp2 varsa)
        var score1El = document.getElementById('score1');
        var score2El = document.getElementById('score2');
        var hasPen = match.pen1 !== undefined && match.pen1 !== null && match.pen2 !== undefined && match.pen2 !== null;
        
        if (isPreMatch) {
            score1El.innerHTML = 'vs';
            score2El.innerHTML = '';
        } else if (hasPen) {
            // Samsunspor 1 (p 3) - (p 1) Trabzonspor stilinde
            score1El.innerHTML = (match.score1 || 0) + '<span class="pen-badge">(p ' + match.pen1 + ')</span>';
            score2El.innerHTML = '<span class="pen-badge">(p ' + match.pen2 + ')</span>' + (match.score2 || 0);
        } else {
            score1El.innerHTML = match.score1 || 0;
            score2El.innerHTML = match.score2 || 0;
        }
        document.getElementById('scoreSep').style.display = isPreMatch ? 'none' : '';
        document.getElementById('leagueInfo').textContent = match.league || 'SÜPER LİG';
        
        // İlk veri geldiğinde scoreboard'u fade-in yap
        document.getElementById('leagueInfo').style.opacity = '1';
        document.getElementById('teamsContainer').style.opacity = '1';
        matchMinute.style.opacity = '1';
        
        if (status === 'MAÇ SONU' || status === 'FT' || status === 'AP' || status === 'AET' || status === 'Pen.') {
            matchMinute.textContent = 'MAÇ SONU';
            matchMinute.className = 'match-minute ended';
            statusText.textContent = 'CANLI';
            statusBadge.className = 'live-badge';
        } else if (isPreMatch) {
            matchMinute.textContent = status === 'BAŞLAMADI' ? 'MAÇ ÖNÜ' : status;
            matchMinute.className = 'match-minute';
            statusText.textContent = 'CANLI';
            statusBadge.className = 'live-badge';
        } else {
            matchMinute.textContent = status;
            matchMinute.className = 'match-minute';
            statusText.textContent = 'CANLI';
            statusBadge.className = 'live-badge';
        }

        // Bildirim gönder - maç başladı, gol oldu, devre arası, maç bitti
        sendMatchNotification(match, status);
    }

    // ============================================
    // BİLDİRİM SİSTEMİ
    // ============================================
    function requestNotificationPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            notificationsEnabled = true;
            updateNotifUI(true);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function(perm) {
                notificationsEnabled = (perm === 'granted');
                updateNotifUI(notificationsEnabled);
            });
        }
    }

    function updateNotifUI(enabled) {
        var btn = document.getElementById('notifToggle');
        if (!btn) return;
        var statusEl = btn.querySelector('.notif-status');
        btn.classList.remove('active');
        btn.classList.remove('denied');
        
        if (enabled) {
            btn.classList.add('active');
            if (statusEl) statusEl.textContent = 'AÇIK';
        } else if ('Notification' in window && Notification.permission === 'denied') {
            btn.classList.add('denied');
            if (statusEl) statusEl.textContent = 'REDDEDİLDİ';
        } else {
            if (statusEl) statusEl.textContent = 'KAPALI';
        }
    }

    function toggleNotifications() {
        if (!('Notification' in window)) {
            alert('Bu tarayıcı bildirimleri desteklemiyor.');
            return;
        }
        if (Notification.permission === 'denied') {
            alert('Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.');
            return;
        }
        if (!notificationsEnabled) {
            Notification.requestPermission().then(function(perm) {
                notificationsEnabled = (perm === 'granted');
                updateNotifUI(notificationsEnabled);
                if (notificationsEnabled) {
                    sendNotification('Bildirimler Açıldı', 'Maç başladığında, gol olduğunda bildirim alacaksınız!', 'info');
                }
            });
        } else {
            notificationsEnabled = false;
            updateNotifUI(false);
        }
    }

    function sendMatchNotification(match, status) {
        if (!notificationsEnabled) return;
        var t1 = match.team1 || '---';
        var t2 = match.team2 || '---';
        var s1 = match.score1 || 0;
        var s2 = match.score2 || 0;
        var key = t1 + '-' + t2 + '-' + status + '-' + s1 + '-' + s2;
        
        // Aynı bildirim tekrar gönderilmesin
        if (key === lastNotifiedStatus) return;
        
        var title = '';
        var body = '';
        var shouldNotify = false;
        
        // Maç canlı olarak başladı
        if ((status.includes("'") || status === 'CANLI' || status === '1. YARI') && lastNotifiedStatus.includes('MAÇ ÖNÜ')) {
            title = 'MAÇ BAŞLADI!';
            body = t1 + ' vs ' + t2 + ' maçı başladı!';
            shouldNotify = true;
        }
        // Gol oldu (skor değişti)
        if (lastNotifiedStatus) {
            var prevScoreMatch = lastNotifiedStatus.match(/-(\d+)-(\d+)$/);
            if (prevScoreMatch) {
                var prevS1 = parseInt(prevScoreMatch[1]);
                var prevS2 = parseInt(prevScoreMatch[2]);
                if ((s1 > prevS1 || s2 > prevS2) && (status.includes("'") || status === 'CANLI' || status === '1. YARI' || status === '2. YARI')) {
                    title = 'GOOOL!';
                    body = t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2;
                    shouldNotify = true;
                }
            }
        }
        // Devre arası
        if (status === 'DEVRE ARASI' && !lastNotifiedStatus.includes('DEVRE ARASI')) {
            title = 'DEVRE ARASI';
            body = t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2;
            shouldNotify = true;
        }
        // Maç bitti
        if ((status === 'MAÇ SONU' || status === 'FT') && !lastNotifiedStatus.includes('MAÇ SONU') && !lastNotifiedStatus.includes('FT')) {
            title = 'MAÇ BİTTİ';
            body = t1 + ' ' + s1 + ' - ' + s2 + ' ' + t2 + ' - Maç sona erdi!';
            shouldNotify = true;
        }

        lastNotifiedStatus = key;
        if (shouldNotify) sendNotification(title, body, 'match');
    }

    function sendNotification(title, body, type) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        var icon = getNotifIcon(type);
        var badge = getNotifIcon(type);
        
        // Service Worker varsa onun üzerinden gönder (site kapalıyken de çalışır)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(function(reg) {
                reg.showNotification(title, {
                    body: body,
                    icon: icon,
                    badge: badge,
                    tag: 'banban-' + type + '-' + Date.now(),
                    renotify: true,
                    requireInteraction: true
                });
            });
        } else {
            try {
                var n = new Notification(title, {
                    body: body,
                    icon: icon,
                    badge: badge,
                    tag: 'banban-' + type + '-' + Date.now(),
                    renotify: true,
                    requireInteraction: true
                });
                n.onclick = function() { window.focus(); n.close(); };
                setTimeout(function() { n.close(); }, 10000);
            } catch(e) {}
        }
    }
    
    // Tip bazlı bildirim ikonu - gol/kart/penaltı/düdük vs.
    function getNotifIcon(type) {
        var map = {
            goal: 'icons/goal.png',
            redcard: 'icons/redcard.png',
            yellowcard: 'icons/yellowcard.png',
            penalty: 'icons/penalty.png',
            kickoff: 'icons/kickoff.png',
            halftime: 'icons/halftime.png',
            fulltime: 'icons/fulltime.png',
            info: 'icons/info.png',
            match: 'icons/info.png'
        };
        return map[type] || 'icons/info.png';
    }
    
    // Service Worker kayıt
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function() {});
    }

    window.toggleNotifications = toggleNotifications;

    // ============================================
    // CHANNEL SELECTOR
    // ============================================
    function initChannelTabs() {
        document.querySelectorAll('.channel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // REKLAM OYNUYORSA: kanal değişimini TAMAMEN engelle (görsel dahil)
                if (_prerollActive) {
                    e.preventDefault();
                    e.stopPropagation();
                    showInAppNotification('REKLAM OYNUYOR', 'Reklam bittiğinde kanal değişebilirsin.', 'info');
                    return;
                }
                const channel = tab.dataset.channel;
                document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentChannel = channel;
                currentServerIndex = 0;
                updateServerUI();

                const ch = CHANNELS[channel];
                if (!ch || ch.status === 'maintenance') {
                    if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
                    if (crashCheckInterval) { clearInterval(crashCheckInterval); crashCheckInterval = null; }
                    video.pause();
                    video.removeAttribute('src');
                    showMaintenance();
                    return;
                }
                hideAdOverlay();
                setupStream();
            });
        });
    }

    // Reklam oynarken kanal tabs'ını görsel olarak kilitli göster
    function setChannelTabsLocked(locked) {
        document.querySelectorAll('.channel-tab').forEach(function(t) {
            if (locked) {
                t.style.opacity = '0.4';
                t.style.cursor = 'not-allowed';
                t.setAttribute('aria-disabled', 'true');
            } else {
                t.style.opacity = '';
                t.style.cursor = '';
                t.removeAttribute('aria-disabled');
            }
        });
    }

    // ============================================
    // STREAM SETUP
    // ============================================
    const MAX_RETRIES = 3;
    let streamSessionId = 0; // Her kanal geçişinde artar, eski callback'leri engeller
    var _prerollDoneThisSession = {}; // Kanal başına session'da 1 kez preroll
    var _prerollActive = false;
    var _prerollMaxTimer = null;
    var _prerollSessionId = 0;

    // ============================================
    // i18n - TR/EN (kullanıcı Türkiye dışındaysa İngilizce)
    // ============================================
    function detectDefaultLang() {
        try {
            var saved = localStorage.getItem('bb_lang');
            if (saved === 'tr' || saved === 'en') return saved;
        } catch(e) {}
        var nav = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
        // TZ kontrolü de: Europe/Istanbul → TR
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (/istanbul|turkey|europe\/istanbul/i.test(tz)) return 'tr';
        } catch(e) {}
        if (nav.startsWith('tr')) return 'tr';
        return 'en';
    }
    var I18N = {
        tr: {
            MATCH_CENTER: 'MAÇ MERKEZİ', ALL: 'TÜMÜ', LIVE: 'CANLI', MATCH_ENDED: 'MAÇ SONU', MATCH_BEFORE: 'MAÇ ÖNÜ',
            NO_MATCHES: 'Bugün bu ligde maç yok', LOADING: 'Maçlar yükleniyor...',
            SERVERS: 'SUNUCULAR', NOTIF_ON: 'AÇIK', NOTIF_OFF: 'KAPALI', NOTIF_DENIED: 'REDDEDİLDİ',
            WATCH_LIVE: 'CANLI İZLE', UNMUTE: 'SESİ AÇ', CAST: 'CAST', AD_RUNNING: 'REKLAM OYNUYOR',
            AD_WAIT: 'Reklamın bitmesini bekleyin.', BROADCAST_STARTING: 'YAYIN BAŞLIYOR...',
            NEW: 'YENİ', EVENTS: 'OLAYLAR', GOALS: 'GOLLER', YELLOW_CARD: 'SARI KART',
            RED_CARD: 'KIRMIZI KART', PENALTY: 'PENALTI', NO_EVENTS: 'Henüz olay yok'
        },
        en: {
            MATCH_CENTER: 'MATCH CENTER', ALL: 'ALL', LIVE: 'LIVE', MATCH_ENDED: 'FULL TIME', MATCH_BEFORE: 'KICK-OFF',
            NO_MATCHES: 'No matches today', LOADING: 'Loading matches...',
            SERVERS: 'SERVERS', NOTIF_ON: 'ON', NOTIF_OFF: 'OFF', NOTIF_DENIED: 'DENIED',
            WATCH_LIVE: 'WATCH LIVE', UNMUTE: 'UNMUTE', CAST: 'CAST', AD_RUNNING: 'AD PLAYING',
            AD_WAIT: 'Please wait for the ad to finish.', BROADCAST_STARTING: 'BROADCAST STARTING...',
            NEW: 'NEW', EVENTS: 'EVENTS', GOALS: 'GOALS', YELLOW_CARD: 'YELLOW CARD',
            RED_CARD: 'RED CARD', PENALTY: 'PENALTY', NO_EVENTS: 'No events yet'
        }
    };
    window._siteLang = detectDefaultLang();
    function t(key) { return (I18N[window._siteLang] && I18N[window._siteLang][key]) || I18N.tr[key] || key; }
    function applyI18n() {
        // Dil toggle buton state'i
        var btn = document.getElementById('langToggle');
        if (btn) btn.textContent = window._siteLang.toUpperCase();
        // Match center title
        var mc = document.querySelector('.match-center-title');
        if (mc) mc.textContent = t('MATCH_CENTER');
        // league filter ilk buton TÜMÜ
        var allBtn = document.querySelector('.league-filter-btn[data-league="all"]');
        if (allBtn) allBtn.textContent = t('ALL');
        // Sunucular
        var sTitle = document.querySelector('.server-title');
        if (sTitle) sTitle.textContent = t('SERVERS');
        // NEW badges
        document.querySelectorAll('.new-badge').forEach(function(b){ b.textContent = t('NEW'); });
        // Unmute button
        var um = document.getElementById('unmuteBtn');
        if (um) um.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg><span>' + t('UNMUTE') + '</span>';
    }
    window.toggleLang = function() {
        window._siteLang = (window._siteLang === 'tr') ? 'en' : 'tr';
        try { localStorage.setItem('bb_lang', window._siteLang); } catch(e) {}
        applyI18n();
    };
    function getAppStoreUrl(packageName) {
        var ua = (navigator.userAgent || '').toLowerCase();
        var isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform && /^(iPhone|iPad|iPod)/.test(navigator.platform));
        var isHuawei = /huawei|hms|honor/.test(ua);
        var isXiaomi = /miui|xiaomi|redmi|poco/.test(ua);
        if (isIOS) {
            // iOS App Store deep link
            return 'itms-apps://apps.apple.com/app/' + encodeURIComponent(packageName);
        }
        if (isHuawei) {
            // Huawei AppGallery
            return 'appmarket://details?id=' + packageName;
        }
        if (isXiaomi) {
            // Xiaomi GetApps (ama Play Store da mevcut)
            return 'mimarket://details?id=' + packageName;
        }
        // Varsayılan Android: market://details açar Play Store'u
        return 'market://details?id=' + packageName;
    }
    
    // Reklam bitince otomatik store redirect (user action olmadan çalışması için location.href)
    function redirectToAppStore(ad) {
        if (!ad) return;
        var url = ad.url || '';
        // Ad URL'den package name çıkar
        var match = url.match(/[?&]id=([^&]+)/);
        var pkg = match ? match[1] : '';
        var ua = (navigator.userAgent || '').toLowerCase();
        var isAndroid = /android/i.test(ua);
        var isIOS = /iphone|ipad|ipod/.test(ua);
        var isMobile = isAndroid || isIOS;

        if (!pkg) {
            // Package yoksa sadece URL'yi aç
            try { window.location.href = url; } catch(e) {}
            return;
        }

        var deepLink = getAppStoreUrl(pkg);

        // MOBILE: direkt location.href ile deep link → popup block yok
        if (isMobile) {
            // Intent scheme ile dene (Android'de Play Store app açılır; yoksa browser Play Store URL'ye fallback)
            if (isAndroid) {
                // Android intent: Play Store app yoksa fallback=url açar
                var intentUrl = 'intent://details?id=' + pkg +
                    '#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=' +
                    encodeURIComponent(url) + ';end';
                try { window.location.href = intentUrl; return; } catch(e) {}
            }
            // iOS & Huawei & Xiaomi: doğrudan deep link
            try { window.location.href = deepLink; } catch(e) {}
            // Fallback 1.5sn sonra (uygulama yoksa Play Store webine)
            setTimeout(function() {
                try { window.location.href = url; } catch(e) {}
            }, 1500);
            return;
        }

        // DESKTOP: yeni sekmede Play Store web sayfasını aç
        try { window.open(url, '_blank'); } catch(e) {
            try { window.location.href = url; } catch(ee) {}
        }
    }

    // Pre-roll reklam: kanal başlamadan önce oyun reklamı, ATLAMA YOK, bitince yayın başlar
    function playPrerollAd(onComplete) {
        _prerollActive = true;
        _prerollSessionId++;
        var mySession = _prerollSessionId;
        setChannelTabsLocked(true); // Reklam sırasında kanal değişimini kilitle
        
        // Eski timer temizle
        if (_prerollMaxTimer) { clearTimeout(_prerollMaxTimer); _prerollMaxTimer = null; }
        
        // Overlay temizle
        loadingOverlay.classList.add('hidden');
        errorOverlay.classList.add('hidden');
        maintenanceOverlay.classList.add('hidden');
        hideFreezeOverlay();
        
        // Önceki stream temizle
        if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
        if (crashCheckInterval) { clearInterval(crashCheckInterval); crashCheckInterval = null; }
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.onerror = null;
        video.onended = null;
        
        var ad = getAd();
        nextAd();
        // YT iframe'den geçilmişse video gizli kalmış olabilir - görünür yap
        video.style.display = '';
        var _oldYt = document.getElementById('ytIframe');
        if (_oldYt) _oldYt.remove();
        video.loop = false;
        video.muted = isMuted;
        video.style.filter = 'none';
        video.src = ad.vid + '.webm';
        video.onerror = function() { video.onerror = null; video.src = ad.vid + '.mp4'; };
        var _adPlay = video.play();
        if (_adPlay && _adPlay.catch) {
            _adPlay.catch(function() {
                // Autoplay engellendi - muted fallback, unmute butonu göster
                video.muted = true;
                isMuted = true;
                video.play().catch(function(){});
                if (unmuteBtn) unmuteBtn.classList.remove('hidden');
            });
        }
        isPlaying = true;
        unmuteBtn.classList.toggle('hidden', !isMuted);
        updateQualityMenu([]);
        
        // REKLAM badge - TIKLANABILIR (Play Store'a yönlendirir)
        hideAdOverlay();
        var ov = document.createElement('div');
        ov.id = 'adOverlay';
        ov.setAttribute('data-testid', 'preroll-overlay');
        ov.style.cssText = 'position:absolute;top:15px;left:60px;z-index:22;padding:8px 16px;background:linear-gradient(135deg,'+ad.color+'ee,rgba(170,0,255,0.9));font-family:Orbitron,sans-serif;font-size:12px;font-weight:700;color:#fff;letter-spacing:2px;border:1px solid rgba(255,255,255,0.4);box-shadow:0 0 20px '+ad.color+'80;cursor:pointer;user-select:none;';
        ov.textContent = 'REKLAM · ' + ad.name + ' · TIKLA';
        ov.onclick = function(e) { e.stopPropagation(); redirectToAppStore(ad); };
        document.querySelector('.video-wrapper').appendChild(ov);
        
        // Yayın başlıyor göstergesi (ses butonunu kaplamasın - ÜST ORTA)
        var info = document.createElement('div');
        info.id = 'prerollInfo';
        info.setAttribute('data-testid', 'preroll-info');
        info.style.cssText = 'position:absolute;top:18px;left:50%;transform:translateX(-50%);z-index:22;padding:8px 18px;background:rgba(0,0,0,0.8);color:var(--cyan);font-family:VT323,monospace;font-size:13px;border:1px solid var(--cyan);letter-spacing:2px;pointer-events:none;';
        info.textContent = 'YAYIN BAŞLIYOR...';
        document.querySelector('.video-wrapper').appendChild(info);
        
        // Tıklama engel katmanı KALDIRILDI
        // (Video zaten browser controls'sız, clickLayer ses butonunu/CC'yi blokluyordu - kritik bug)
        // Reklam atlama zaten playPrerollAd mantığıyla engelleniyor, ayrıca overlay gerekmez.
        
        var MAX_AD_DURATION = 60000; // 60sn güvenlik limiti (reklam hang durumunda)
        var done = false;
        
        function finish(triggerRedirect) {
            if (done) return;
            // Farklı preroll başlatıldıysa eski finish'i çalıştırma
            if (mySession !== _prerollSessionId) { done = true; return; }
            done = true;
            if (_prerollMaxTimer) { clearTimeout(_prerollMaxTimer); _prerollMaxTimer = null; }
            hideAdOverlay();
            var el = document.getElementById('prerollInfo');
            if (el) el.remove();
            var cl = document.getElementById('prerollClickLayer');
            if (cl) cl.remove();
            video.onended = null;
            video.onerror = null;
            _prerollActive = false;
            setChannelTabsLocked(false); // Reklam bitti, kanallar tıklanabilir
            // Reklam sonuna kadar oynadıysa auto-redirect (user action flag user click = aslında natural end)
            if (triggerRedirect === true) {
                redirectToAppStore(ad);
            }
            if (onComplete) onComplete();
        }
        
        // Reklam bitince (video.onended) otomatik store'a yönlendir + yayına geç
        video.onended = function() { finish(true); };
        
        // Güvenlik: video yüklenmezse veya çok uzunsa zaman sonra geç (redirect YOK - ortada kesilmiş)
        _prerollMaxTimer = setTimeout(function() { finish(false); }, MAX_AD_DURATION);
    }

    function setupStream(skipPreroll) {
        let loadTimeout; // TDZ fix: YT branch'inde kullanılmadan önce tanımlı olmalı
        const channel = CHANNELS[currentChannel];
        if (!channel || channel.status === 'maintenance') { showMaintenance(); return; }

        // Preroll aktifse kanal değişimini ENGELLE - reklam bitene kadar beklemelisin
        if (_prerollActive && !skipPreroll) {
            showInAppNotification('REKLAM OYNUYOR', 'Reklamın bitmesini bekleyin, sonra kanal değişir.', 'info');
            return;
        }

        // Eski YouTube iframe varsa kaldır
        var oldIframe = document.getElementById('ytIframe');
        if (oldIframe) oldIframe.remove();
        // Altyazı track'lerini temizle (kanal değişimi takılı altyazı fix)
        video.querySelectorAll('track').forEach(function(t) { t.remove(); });

        // PRE-ROLL REKLAMI: SADECE gerçek yayınlarda (TRT, beIN vb.). Trailerlerde yok.
        var isBroadcast = !channel.isAd && !channel.isLocalVideo && !channel.isTrailer && !channel.isYoutube;
        if (!skipPreroll && isBroadcast && !_prerollDoneThisSession[currentChannel]) {
            _prerollDoneThisSession[currentChannel] = true;
            playPrerollAd(function() { setupStream(true); });
            return;
        }

        // Clear overlays
        loadingOverlay.classList.remove('hidden');
        errorOverlay.classList.add('hidden');
        maintenanceOverlay.classList.add('hidden');
        hideFreezeOverlay();

        // === CLEANUP: Önceki stream/video'yu tamamen temizle ===
        if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
        if (crashCheckInterval) { clearInterval(crashCheckInterval); crashCheckInterval = null; }
        video.pause();
        video.removeAttribute('src');
        video.load(); // Önceki buffer'ı temizle
        video.onerror = null;
        video.onended = null;
        video.style.filter = 'none';
        // Preroll artıkları kalmışsa temizle
        hideAdOverlay();
        var _pInfo = document.getElementById('prerollInfo');
        if (_pInfo) _pInfo.remove();
        var _pClick = document.getElementById('prerollClickLayer');
        if (_pClick) _pClick.remove();
        isPlaying = false;
        retryCount = 0;
        streamSessionId++; // Eski callback'leri geçersiz kıl
        stopMidrollTimer(); // Kanal değişiminde eski mid-roll timer'ı iptal et
        const mySession = streamSessionId;

        // "YAKINDA" placeholder branch (resmi fragman henüz yok)
        if (channel.isComingSoon) {
            clearTimeout(loadTimeout);
            video.style.display = 'none';
            loadingOverlay.classList.add('hidden');
            var csWrap = document.createElement('div');
            csWrap.id = 'ytIframe'; // aynı cleanup kullanabilsin
            csWrap.setAttribute('data-testid', 'coming-soon');
            csWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;background:radial-gradient(ellipse at center, #180828 0%, #050208 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;';
            csWrap.innerHTML =
                '<div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(255,0,170,0.04) 0 2px,transparent 2px 18px);pointer-events:none;"></div>' +
                '<div style="font-family:Orbitron,sans-serif;font-size:13px;letter-spacing:4px;color:var(--pink);text-shadow:0 0 12px var(--pink);margin-bottom:16px;animation:pulse 2s infinite;">● ' + (channel.name) + '</div>' +
                '<div style="font-family:Orbitron,sans-serif;font-size:clamp(28px,5vw,56px);font-weight:900;letter-spacing:6px;background:linear-gradient(90deg,var(--cyan),var(--pink),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-shadow:0 0 30px rgba(0,240,255,0.3);text-align:center;padding:0 20px;">' + (channel.comingText || 'FRAGMAN YAKINDA') + '</div>' +
                '<div id="ragOktayInfo" style="margin-top:34px;display:flex;align-items:center;gap:14px;font-family:VT323,monospace;color:#e8d4b8;font-size:15px;letter-spacing:2px;background:rgba(0,0,0,0.5);padding:12px 22px;border:1px solid rgba(232,212,184,0.3);cursor:pointer;" title="Tıkla - müziği başlat/durdur">' +
                '<svg id="ragOktayIcon" width="18" height="18" viewBox="0 0 24 24" fill="#e8d4b8" style="animation:pulse 1.5s infinite;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' +
                '<span>♪ RAGGA OKTAY · <em style="color:var(--pink);">HASRETİM GİTME KAL</em></span>' +
                '</div>' +
                '<audio id="ragOktayAudio" preload="auto" loop style="display:none;" src="/ragga_oktay.mp3"></audio>';
            document.querySelector('.video-wrapper').appendChild(csWrap);
            // Şarkıyı oynatmayı dene (user gesture ile gelindiyse ses açık, değilse muted denemesi)
            try {
                var _rgAudio = csWrap.querySelector('#ragOktayAudio');
                var _rgInfo = csWrap.querySelector('#ragOktayInfo');
                if (_rgAudio) {
                    _rgAudio.volume = 0.45;
                    _rgAudio.muted = isMuted;
                    var _rgTry = _rgAudio.play();
                    if (_rgTry && _rgTry.catch) {
                        _rgTry.catch(function(){
                            // Autoplay engellendi - tıklamaya bağla
                            _rgInfo.addEventListener('click', function _rgStart(){
                                _rgAudio.muted = false;
                                _rgAudio.play().catch(function(){});
                                _rgInfo.removeEventListener('click', _rgStart);
                            });
                        });
                    }
                    // Info bandına tıklanınca pause/play
                    _rgInfo.addEventListener('click', function(){
                        if (_rgAudio.paused) { _rgAudio.muted = false; _rgAudio.play().catch(function(){}); }
                        else { _rgAudio.pause(); }
                    });
                }
            } catch(e) {}
            statusText.textContent = 'YAKINDA';
            statusBadge.className = 'live-badge';
            isPlaying = false;
            return;
        }

        // LOKAL TRAILER branch (self-hosted MP4, sıfır external branding)
        if (channel.isLocalTrailer && channel.localUrl) {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
            // YT iframe wrapper'ı kullan (aynı cleanup mantığı)
            var ltWrap = document.createElement('div');
            ltWrap.id = 'ytIframe';
            ltWrap.setAttribute('data-testid', 'local-trailer');
            ltWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;background:#000;overflow:hidden;';
            var ltVideo = document.createElement('video');
            ltVideo.setAttribute('playsinline','');
            ltVideo.setAttribute('controls','');
            ltVideo.src = channel.localUrl;
            ltVideo.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;';
            ltVideo.muted = isMuted;
            ltVideo.autoplay = true;
            // Altyazı (VTT) varsa ekle
            var ccCur = (function(){ try { return localStorage.getItem('bb_sub_lang') || 'tr'; } catch(e){ return 'tr'; } })();
            if (channel.subtitles) {
                channel.subtitles.forEach(function(sub) {
                    var tr = document.createElement('track');
                    tr.kind = 'subtitles';
                    tr.label = sub.label;
                    tr.srclang = sub.lang;
                    tr.src = sub.url;
                    if (ccCur !== 'off' && sub.lang === ccCur) tr.default = true;
                    ltVideo.appendChild(tr);
                });
            }
            ltWrap.appendChild(ltVideo);
            // Film başlığı (kendi markamız)
            var ltBrand = document.createElement('div');
            ltBrand.style.cssText = 'position:absolute;top:18px;left:22px;z-index:4;font-family:Orbitron,sans-serif;font-size:14px;font-weight:700;color:var(--cyan);letter-spacing:2.5px;text-shadow:0 0 10px rgba(0,240,255,0.7);pointer-events:none;';
            ltBrand.textContent = '● ' + channel.name;
            ltWrap.appendChild(ltBrand);
            document.querySelector('.video-wrapper').appendChild(ltWrap);
            video.style.display = 'none';
            statusText.textContent = 'TRAİLER';
            statusBadge.className = 'live-badge';
            isPlaying = true;
            _tryNextCycle = 0;
            ltVideo.play().catch(function(){});
            return;
        }

        // YOUTUBE IFRAME branch (trailer kanalları)
        if ((channel.isYoutube && channel.youtubeId) || (channel.isDailymotion && channel.dmId)) {
            clearTimeout(loadTimeout);
            video.style.display = 'none';
            loadingOverlay.classList.add('hidden');
            // Wrapper: iframe + overlay (platform title/logo gizleme)
            var ytWrap = document.createElement('div');
            ytWrap.id = 'ytIframe';
            ytWrap.setAttribute('data-testid', 'yt-iframe');
            ytWrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;background:#000;overflow:hidden;';
            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;';
            // Altyazı: kullanıcının seçtiği dil (localStorage'dan), yoksa site dili
            var ytLang = (function(){ try { return localStorage.getItem('bb_sub_lang') || (window._siteLang || 'tr'); } catch(e){ return 'tr'; } })();
            var ccOn = (ytLang !== 'off');
            var useLang = ccOn ? ytLang : 'tr';
            var embedUrl;
            if (channel.isDailymotion) {
                // Dailymotion - kendi branding'ini gizle (ui-logo=0, ui-start-screen-info=0)
                embedUrl = 'https://www.dailymotion.com/embed/video/' + channel.dmId +
                    '?autoplay=1&mute=1&ui-logo=0&ui-start-screen-info=0&ui-highlight=00f0ff&queue-enable=0&sharing-enable=0&endscreen-enable=0' +
                    '&subtitles-default=' + (ccOn ? useLang : '');
            } else {
                embedUrl = 'https://www.youtube-nocookie.com/embed/' + channel.youtubeId +
                    '?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1' +
                    '&iv_load_policy=3&fs=1&disablekb=0' +
                    '&cc_load_policy=' + (ccOn?'1':'0') + '&cc_lang_pref=' + useLang + '&hl=' + useLang +
                    '&playlist=' + channel.youtubeId + '&loop=1';
            }
            iframe.src = embedUrl;
            iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            iframe.setAttribute('allowfullscreen', 'true');
            ytWrap.appendChild(iframe);
            // TOP overlay - tüm başlık bar'ını tamamen gizle (mute/close gibi butonlar yok zaten)
            var ytTopCover = document.createElement('div');
            ytTopCover.style.cssText = 'position:absolute;top:0;left:0;right:0;height:72px;background:linear-gradient(180deg,#000 0%,#000 70%,transparent 100%);z-index:2;pointer-events:none;';
            ytWrap.appendChild(ytTopCover);
            // BOTTOM-RIGHT - "Watch on YouTube / Dailymotion" logo
            var ytLogoCover = document.createElement('div');
            ytLogoCover.style.cssText = 'position:absolute;bottom:28px;right:0;width:160px;height:60px;background:#000;z-index:2;pointer-events:none;border-top-left-radius:2px;';
            ytWrap.appendChild(ytLogoCover);
            // BOTTOM-LEFT (Dailymotion başlık/info kısmı)
            var ytBLCover = document.createElement('div');
            ytBLCover.style.cssText = 'position:absolute;bottom:28px;left:0;width:55px;height:50px;background:#000;z-index:2;pointer-events:none;';
            ytWrap.appendChild(ytBLCover);
            // Video bitiminde "related videos" grid'ini gizle (YouTube rel=0 yetmiyor bazen)
            var ytEndCover = document.createElement('div');
            ytEndCover.id = 'ytEndCover';
            ytEndCover.style.cssText = 'position:absolute;top:72px;left:0;right:0;bottom:80px;background:transparent;z-index:1;pointer-events:none;';
            ytWrap.appendChild(ytEndCover);
            // Film başlığı overlay (kendi markamız)
            var ytBrand = document.createElement('div');
            ytBrand.style.cssText = 'position:absolute;top:18px;left:22px;z-index:4;font-family:Orbitron,sans-serif;font-size:14px;font-weight:700;color:var(--cyan);letter-spacing:2.5px;text-shadow:0 0 10px rgba(0,240,255,0.6);pointer-events:none;';
            ytBrand.textContent = '● ' + channel.name;
            ytWrap.appendChild(ytBrand);

            document.querySelector('.video-wrapper').appendChild(ytWrap);
            statusText.textContent = 'TRAİLER';
            statusBadge.className = 'live-badge';
            isPlaying = true;
            _tryNextCycle = 0;
            return;
        }

        // Video görünür yap (YT iframe'den dönülünce)
        video.style.display = '';

        // Loading timeout - 15s sonra hala yüklenemezse hata göster
        loadTimeout = setTimeout(() => {
            if (!loadingOverlay.classList.contains('hidden')) {
                loadingOverlay.classList.add('hidden');
                tryNextServer();
            }
        }, 10000);

        // REKLAM - her seferinde farklı oyunun videosu oynar
        if (channel.isAd) {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
            video.loop = false;
            video.muted = isMuted;
            video.style.filter = 'none';
            var ad = getAd();
            nextAd(); // Sıradaki reklama geç (bir sonraki tıklamada farklı göster)
            // Önce webm, sonra mp4
            video.src = ad.vid + '.webm';
            video.onerror = function() {
                video.onerror = null;
                video.src = ad.vid + '.mp4';
            };
            video.onended = function() { redirectToAppStore(ad); };
            video.load();
            video.play().catch(function() {});
            isPlaying = true;
            unmuteBtn.classList.toggle('hidden', !isMuted);
            updateQualityMenu([]);
            // Overlay - önceki overlayleri temizle
            hideAdOverlay();
            var ov = document.createElement('div'); ov.id = 'adOverlay';
            ov.setAttribute('data-testid', 'ad-overlay');
            ov.style.cssText = 'position:absolute;top:15px;left:60px;z-index:20;padding:8px 16px;background:linear-gradient(135deg,'+ad.color+'ee,rgba(170,0,255,0.9));font-family:Orbitron,sans-serif;font-size:12px;font-weight:700;color:#fff;letter-spacing:2px;border:1px solid rgba(255,255,255,0.4);box-shadow:0 0 20px '+ad.color+'80;pointer-events:none;';
            ov.textContent = 'REKLAM · ' + ad.name;
            document.querySelector('.video-wrapper').appendChild(ov);
            return;
        }

        // DEMO 3 - Lokal video dosyası (loop)
        if (channel.isLocalVideo) {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
            video.loop = true;
            video.muted = isMuted;
            video.style.filter = 'none';
            video.src = channel.videoFile + '.webm';
            video.onerror = function() { video.onerror = null; video.src = channel.videoFile + '.mp4'; };
            video.load();
            video.play().catch(function() {});
            isPlaying = true;
            unmuteBtn.classList.toggle('hidden', !isMuted);
            updateQualityMenu([]);
            hideAdOverlay();
            return;
        }

        // Get stream URL based on server index
        const servers = SERVER_ALTERNATIVES[currentChannel] || [];
        const streamUrl = servers[currentServerIndex] || channel.stream;
        if (!streamUrl) { showMaintenance(); return; }

        video.loop = false;
        video.removeAttribute('src');

        // MP4 direkt oynatma (HLS.js atlat) - Blender trailer'ları gibi native MP4
        var isMp4Url = channel.isMp4 || /\.(mp4|m4v|mov|webm)(\?|$)/i.test(streamUrl);
        if (isMp4Url) {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
            video.loop = true; // Trailer'lar loop
            video.muted = isMuted;
            video.style.filter = 'none';
            video.src = streamUrl;
            var loadErr = false;
            video.addEventListener('loadedmetadata', function onMeta() {
                video.removeEventListener('loadedmetadata', onMeta);
                if (mySession !== streamSessionId) return;
                _tryNextCycle = 0; // Başarılı yüklendi, sayaç sıfırla
                loadingOverlay.classList.add('hidden');
                statusText.textContent = 'CANLI';
                statusBadge.className = 'live-badge';
                video.play().catch(function(){});
                isPlaying = true;
                retryCount = 0;
                unmuteBtn.classList.toggle('hidden', !isMuted);
                updateSubtitles();
                updateConnectionIcon();
                updateQualityMenu([]);
                startMidrollTimer(); // Canlı yayın başladı, mid-roll reklam timer'ı kur
            }, { once: true });
            video.addEventListener('error', function onErr() {
                video.removeEventListener('error', onErr);
                if (mySession !== streamSessionId) return;
                if (!loadErr) { loadErr = true; tryNextServer(); }
            }, { once: true });
            video.load();
            return;
        }

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true, lowLatencyMode: true,
                backBufferLength: 15, maxBufferLength: 20, maxMaxBufferLength: 40,
                manifestLoadingTimeOut: 10000, manifestLoadingMaxRetry: 2,
                levelLoadingTimeOut: 10000, fragLoadingTimeOut: 15000,
                startLevel: -1, abrEwmaDefaultEstimate: 500000,
                testBandwidth: true, progressive: true
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
                if (mySession !== streamSessionId) return; // Kanal değişti, eski callback'i yoksay
                _tryNextCycle = 0; // Başarılı yüklendi, sayaç sıfırla
                clearTimeout(loadTimeout);
                loadingOverlay.classList.add('hidden');
                statusText.textContent = 'CANLI';
                statusBadge.className = 'live-badge';
                video.muted = isMuted; // Ses durumunu zorla
                video.play().catch(() => {});
                isPlaying = true;
                retryCount = 0;
                unmuteBtn.classList.toggle('hidden', !isMuted);
                updateSubtitles();
                startCrashDetection();
                updateConnectionIcon();
                updateQualityMenu(hls.levels || []);
                startMidrollTimer(); // Canlı yayın başladı, mid-roll reklam timer'ı kur
                // Reklam kanalıysa overlay göster
                if (CHANNELS[currentChannel] && CHANNELS[currentChannel].isAd) { hideAdOverlay(); }
            });

            hls.on(Hls.Events.ERROR, (e, data) => {
                if (mySession !== streamSessionId) return; // Kanal değişti, eski hatayı yoksay
                if (!data.fatal) return;
                
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    const code = data.response && data.response.code;
                    if (code === 404 || code === 403) {
                        // Server dead or banned - try next server
                        tryNextServer();
                    } else if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        setTimeout(() => { if (hls) { hls.destroy(); hls = null; } setupStream(true); }, 2000);
                    } else {
                        tryNextServer();
                    }
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    tryNextServer();
                }
            });
            
            // Quality level switch
            hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
                const level = hls.levels[data.level];
                if (level) {
                    const label = getQualityLabel(level.height);
                    document.getElementById('qualityBtn').textContent = hls.currentLevel === -1 ? 'AUTO' : label;
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                loadingOverlay.classList.add('hidden');
                video.play().catch(() => {});
                isPlaying = true;
            }, { once: true });
            video.addEventListener('error', () => tryNextServer(), { once: true });
        } else {
            showStreamError();
        }
    }

    var _tryNextInProgress = false;
    var _tryNextCycle = 0;
    function tryNextServer() {
        if (_tryNextInProgress) return; // Eşzamanlı çağrı engeli
        _tryNextInProgress = true;
        setTimeout(function() { _tryNextInProgress = false; }, 500);
        
        const servers = SERVER_ALTERNATIVES[currentChannel] || [];
        _tryNextCycle++;
        // Sonsuz döngü önlemi: tüm server'lar denenip başarısız olursa hata göster
        if (_tryNextCycle > servers.length * 2) {
            _tryNextCycle = 0;
            showStreamError();
            return;
        }
        if (currentServerIndex < servers.length - 1) {
            currentServerIndex++;
        } else {
            currentServerIndex = 0;
        }
        retryCount = 0;
        updateServerUI();
        if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
        setupStream(true);
    }

    function updateServerUI() {
        var servers = SERVER_ALTERNATIVES[currentChannel] || [];
        var ch = CHANNELS[currentChannel];
        var isLocal = ch && (ch.isAd || ch.isLocalVideo);
        
        document.querySelectorAll('.server-item').forEach(function(item, i) {
            item.classList.toggle('active', i === currentServerIndex);
            var status = item.querySelector('.server-status');
            if (status) {
                if (isLocal) {
                    status.className = 'server-status';
                    item.style.opacity = '0.5';
                } else if (i < servers.length) {
                    status.className = i === currentServerIndex ? 'server-status online' : 'server-status checking';
                    item.style.opacity = '1';
                } else {
                    status.className = 'server-status';
                    item.style.opacity = '0.5';
                }
            }
            // Hepsi tıklanabilir
            item.style.pointerEvents = 'auto';
        });
    }

    window.switchServer = function(index) {
        currentServerIndex = index;
        retryCount = 0;
        updateServerUI();
        if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
        // Sunucuya göre otomatik dil/altyazı (kullanıcı manuel seçim yapmadıysa)
        try {
            var sl = window.getServerLang ? window.getServerLang(index) : null;
            var userSet = false;
            try { userSet = !!localStorage.getItem('bb_sub_lang_user_set'); } catch(e){}
            if (sl && !userSet) {
                setCcLang(sl.ccOn ? sl.sub : 'off');
            }
            var label = (index === 0) ? 'SUNUCU 1 · TR ses + TR altyazı'
                : (index === 1) ? 'SUNUCU 2 · EN ses (altyazısız)'
                : 'SUNUCU 3 (EU) · EN ses + EN altyazı';
            if (typeof showInAppNotification === 'function') {
                showInAppNotification('SUNUCU DEĞİŞTİ', label, 'info');
            }
        } catch(e) {}
        setupStream(true); // Manuel sunucu geçişinde preroll atla
    };

    // ============================================
    // MID-ROLL REKLAM (YouTube tarzı, her 17 dakikada bir)
    // ============================================
    var _midrollTimer = null;
    var MIDROLL_INTERVAL = 17 * 60 * 1000; // 17 dakika
    function startMidrollTimer() {
        stopMidrollTimer();
        _midrollTimer = setTimeout(function tick() {
            var ch = CHANNELS[currentChannel];
            // Sadece canlı yayınlarda (trailer/coming-soon/maintenance değil) ve preroll yoksa
            var isLive = ch && !ch.isTrailer && !ch.isYoutube && !ch.isComingSoon && ch.status !== 'maintenance';
            if (isLive && !_prerollActive && isPlaying) {
                playPrerollAd(function() {
                    setupStream(true); // Reklam sonrası yayını geri başlat
                    startMidrollTimer(); // Sıradaki reklam için timer
                });
            } else {
                // Koşullar uygun değilse 17 dk sonra tekrar kontrol et
                startMidrollTimer();
            }
        }, MIDROLL_INTERVAL);
    }
    function stopMidrollTimer() {
        if (_midrollTimer) { clearTimeout(_midrollTimer); _midrollTimer = null; }
    }

    // ============================================
    // SUBTITLES
    // ============================================
    function updateSubtitles() {
        video.querySelectorAll('track').forEach(t => t.remove());
        const channel = CHANNELS[currentChannel];
        if (channel && channel.subtitles) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = channel.subLabel || 'Türkçe';
            track.srclang = channel.subLang || 'tr';
            track.src = channel.subtitles; track.default = true;
            video.appendChild(track);
            setTimeout(() => { if (video.textTracks.length > 0) video.textTracks[0].mode = 'showing'; }, 500);
        }
    }

    // ============================================
    // OVERLAYS
    // ============================================
    function showStreamError() {
        // YAYIN HATASI - freeze gibi auto-retry mesajı göster (bakım moduna girme)
        loadingOverlay.classList.add('hidden');
        maintenanceOverlay.classList.add('hidden');
        errorOverlay.classList.add('hidden');
        hideAdOverlay();
        // Mevcut freeze overlay varsa tekrar oluşturma
        if (document.getElementById('freezeOverlay')) return;
        const div = document.createElement('div');
        div.id = 'freezeOverlay';
        div.className = 'freeze-overlay';
        div.setAttribute('data-testid', 'stream-retry-overlay');
        div.onclick = () => { hideFreezeOverlay(); retryStream(); };
        div.innerHTML = '<svg width="56" height="56" viewBox="0 0 24 24" fill="var(--cyan)"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg><div class="freeze-text">YAYIN YENİLENİYOR</div><div class="freeze-sub">Bekle veya tıkla, otomatik bağlanıyor...</div>';
        document.querySelector('.video-wrapper').appendChild(div);
        // 8 saniye sonra otomatik yeniden dene
        if (_freezeAutoRetryTimer) clearTimeout(_freezeAutoRetryTimer);
        _freezeAutoRetryTimer = setTimeout(() => {
            _freezeAutoRetryTimer = null;
            if (document.getElementById('freezeOverlay')) {
                hideFreezeOverlay();
                _tryNextCycle = 0;
                retryStream();
            }
        }, 8000);
    }

    function showMaintenance() {
        loadingOverlay.classList.add('hidden');
        errorOverlay.classList.add('hidden');
        hideFreezeOverlay();
        maintenanceOverlay.classList.remove('hidden');
        statusBadge.className = 'live-badge maintenance';
        statusText.textContent = 'BAKIM';
        hideAdOverlay();
        stopMidrollTimer(); // Bakım modunda mid-roll timer'ı durdur
    }

    function showAdOverlay() { /* inline olarak taşındı */ }

    function hideAdOverlay() {
        var els = document.querySelectorAll('#adOverlay');
        els.forEach(function(el) { el.remove(); });
    }

    // ============================================
    // CONTROLS
    // ============================================
    function togglePlay() {
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }

    // Video event listeners ile play icon senkronizasyonu
    function syncPlayIcon() {
        const icon = document.getElementById('playIcon');
        if (video.paused) {
            icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            isPlaying = false;
        } else {
            icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            isPlaying = true;
        }
    }

    function toggleMute() {
        if (!video) return;
        isMuted = !isMuted;
        video.muted = isMuted;
        if (!isMuted) {
            video.volume = 0.7;
            video.play().catch(function() {});
        }
        unmuteBtn.classList.toggle('hidden', !isMuted);
        document.getElementById('volumeSlider').value = isMuted ? 0 : Math.round(video.volume * 100);
        const icon = document.getElementById('muteIcon');
        if (isMuted) {
            icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else {
            icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        }
    }

    function setVolume(val) {
        if (!video) return;
        const v = parseInt(val) / 100;
        video.volume = v;
        video.muted = v === 0;
        isMuted = v === 0;
        unmuteBtn.classList.toggle('hidden', !isMuted);
        const icon = document.getElementById('muteIcon');
        if (v === 0) {
            icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else if (v < 0.5) {
            icon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
        } else {
            icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        }
    }

    async function togglePiP() {
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else if (video.requestPictureInPicture) await video.requestPictureInPicture();
            else alert('Bu tarayıcı küçük pencere modunu desteklemiyor');
        } catch (e) {}
    }

    function toggleFullscreen() {
        const w = document.querySelector('.video-wrapper');
        const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
        if (!isFs) {
            if (w.requestFullscreen) w.requestFullscreen();
            else if (w.webkitRequestFullscreen) w.webkitRequestFullscreen();
            else if (w.mozRequestFullScreen) w.mozRequestFullScreen();
            else if (w.msRequestFullscreen) w.msRequestFullscreen();
            else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    }

    function startCast() {
        var ua = (navigator.userAgent || '').toLowerCase();
        var isAndroid = /android/i.test(ua);
        var isIOS = /iphone|ipad|ipod/.test(ua);
        var isXiaomi = /miui|xiaomi|redmi|poco/.test(ua);

        // 1. iOS/Safari AirPlay
        if (isIOS && video.webkitShowPlaybackTargetPicker) {
            try { video.webkitShowPlaybackTargetPicker(); return; } catch(e) {}
        }

        // 2. Remote Playback API (Chromecast/DIAL/AirPlay) — en iyi seçenek
        if (video.remote && typeof video.remote.prompt === 'function') {
            video.remote.prompt().then(function() {
                showInAppNotification('CAST BAĞLANDI', 'TV\'de yansıtma başlatıldı.', 'info');
            }).catch(function() {
                tryCastFallbacks();
            });
            return;
        }

        // 3. Chrome Cast API (global cast framework)
        if (window.cast && window.cast.framework) {
            try {
                var ctx = window.cast.framework.CastContext.getInstance();
                ctx.requestSession();
                return;
            } catch(e) {}
        }

        // 4. Presentation API (DIAL)
        if (navigator.presentation && navigator.presentation.defaultRequest) {
            try { navigator.presentation.defaultRequest.start().catch(function(){ tryCastFallbacks(); }); return; } catch(e) {}
        }

        tryCastFallbacks();

        function tryCastFallbacks() {
            // Android: Miracast / CAST ayarları intent
            if (isAndroid) {
                // Xiaomi/MIUI: Mi Cast intent
                if (isXiaomi) {
                    try {
                        var xiaomiIntent = 'intent://#Intent;action=miui.intent.action.CAST_SETTINGS;end';
                        window.location.href = xiaomiIntent;
                        setTimeout(function() {
                            // Fallback: generic Android Cast settings
                            window.location.href = 'intent:#Intent;action=android.settings.CAST_SETTINGS;end';
                        }, 800);
                        return;
                    } catch(e) {}
                }
                // Generic Android Cast settings
                try {
                    window.location.href = 'intent:#Intent;action=android.settings.CAST_SETTINGS;end';
                    setTimeout(function() {
                        // Ikinci deneme: Wireless Display settings
                        try { window.location.href = 'intent:#Intent;action=android.settings.WIFI_DISPLAY_SETTINGS;end'; } catch(e){}
                    }, 800);
                    return;
                } catch(e) {}
            }
            // Web Share fallback (URL kopyalamak için)
            if (navigator.share) {
                try {
                    navigator.share({ title: 'banbansports UNDERGROUND HD', url: window.location.href });
                    return;
                } catch(e) {}
            }
            showInAppNotification('YANSITMA', 'Chromecast veya AirPlay destekli bir TV gerekli. Bluetooth hoparlörler video yansıtamaz (sadece ses için OS ayarlarını kullanın).', 'info');
        }
    }

    // Fullscreen change
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach(evt => {
        document.addEventListener(evt, () => {
            const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
            document.querySelector('.video-wrapper').classList.toggle('fullscreen-active', !!isFs);
            const icon = document.getElementById('fullscreenIcon');
            icon.innerHTML = isFs
                ? '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'
                : '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
        });
    });

    // ============================================
    // QUALITY SELECTOR
    // ============================================
    function getQualityLabel(height) {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '1440p';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        return '360p';
    }

    function updateQualityMenu(levels) {
        const dropdown = document.getElementById('qualityDropdown');
        dropdown.innerHTML = '<div class="quality-option active" data-level="-1" onclick="setQuality(-1)" data-testid="quality-auto">AUTO <span class="check">&#10003;</span></div>';
        
        if (!levels || levels.length === 0) return;

        // Sort by height descending
        const sorted = levels.map((l, i) => ({ index: i, height: l.height, bitrate: l.bitrate }))
            .sort((a, b) => b.height - a.height);
        
        sorted.forEach(l => {
            const label = getQualityLabel(l.height);
            const bitrate = l.bitrate ? Math.round(l.bitrate / 1000) + ' kbps' : '';
            const div = document.createElement('div');
            div.className = 'quality-option';
            div.dataset.level = l.index;
            div.setAttribute('data-testid', 'quality-' + label.toLowerCase());
            div.onclick = () => setQuality(l.index);
            div.innerHTML = label + ' <span style="font-size:9px;color:var(--text-dim)">' + bitrate + '</span> <span class="check">&#10003;</span>';
            dropdown.appendChild(div);
        });
    }

    function toggleQualityMenu() {
        qualityMenuOpen = !qualityMenuOpen;
        document.getElementById('qualityDropdown').classList.toggle('open', qualityMenuOpen);
    }

    function setQuality(levelIndex) {
        if (hls) {
            hls.currentLevel = levelIndex;
            document.getElementById('qualityBtn').textContent = levelIndex === -1 ? 'AUTO' : getQualityLabel(hls.levels[levelIndex].height);
        }
        // Update active state
        document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.toggle('active', parseInt(opt.dataset.level) === levelIndex);
        });
        qualityMenuOpen = false;
        document.getElementById('qualityDropdown').classList.remove('open');
    }

    // Close quality menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.quality-selector')) {
            qualityMenuOpen = false;
            document.getElementById('qualityDropdown').classList.remove('open');
        }
    });

    // ============================================
    // CONNECTION DETECTION (5G destekli, video içinde)
    // ============================================
    function updateConnectionIcon() {
        const icon = document.getElementById('connectionIcon');
        const text = document.getElementById('connectionText');
        if (!icon || !text) return;
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (conn) {
            const type = conn.type || '';
            const eff = conn.effectiveType || '';
            
            if (type === 'wifi') {
                icon.innerHTML = '<path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>';
                text.textContent = 'WiFi';
                text.style.color = 'var(--green)';
            } else if (type === 'cellular' || eff) {
                icon.innerHTML = '<path d="M2 22h20V2z"/>';
                text.textContent = '5G';
                text.style.color = 'var(--cyan)';
                if (conn.downlink && conn.downlink < 1.5) suggestQualityDrop();
            } else {
                text.textContent = eff === '4g' ? '5G' : eff ? eff.toUpperCase() : 'Online';
                text.style.color = 'var(--green)';
            }
        } else {
            text.textContent = navigator.onLine ? '5G' : 'Offline';
            text.style.color = navigator.onLine ? 'var(--cyan)' : 'var(--red)';
        }
    }

    function suggestQualityDrop() {
        if (hls && hls.levels && hls.levels.length > 1 && hls.currentLevel > 0) {
            hls.currentLevel = hls.currentLevel - 1;
        }
    }

    if (navigator.connection) navigator.connection.addEventListener('change', updateConnectionIcon);
    window.addEventListener('online', updateConnectionIcon);
    window.addEventListener('offline', updateConnectionIcon);
    setInterval(updateConnectionIcon, 15000);

    // ============================================
    // CRASH / FREEZE DETECTION (SMART)
    // ============================================
    const STALL_THRESHOLD = 15;
    const CRASH_THRESHOLD = 45;

    // Video event listeners - TEK SEFERLIK (startCrashDetection dışında)
    video.addEventListener('waiting', function() {
        if (hls && isPlaying) { try { hls.startLoad(); } catch(e) {} }
    });
    video.addEventListener('stalled', function() {
        if (hls && isPlaying) {
            try { hls.startLoad(); } catch(e) {}
            setTimeout(function() { video.play().catch(function(){}); }, 1000);
        }
    });
    video.addEventListener('error', function() {
        if (video.error && (video.error.code === 2 || video.error.code === 4)) {
            tryNextServer();
        }
    });

    function startCrashDetection() {
        if (crashCheckInterval) clearInterval(crashCheckInterval);
        stallCount = 0;
        lastPlaybackTime = video.currentTime;

        crashCheckInterval = setInterval(() => {
            if (!video || video.paused || !isPlaying) return;
            
            const ct = video.currentTime;
            if (Math.abs(ct - lastPlaybackTime) < 0.1) {
                stallCount++;
                
                // 8sn donma → HLS recovery dene
                if (stallCount === 8 && hls) {
                    try { hls.startLoad(); video.play().catch(function(){}); } catch(e) {}
                }
                
                if (stallCount >= CRASH_THRESHOLD) {
                    clearInterval(crashCheckInterval);
                    hideFreezeOverlay();
                    tryNextServer();
                } else if (stallCount >= STALL_THRESHOLD) {
                    showFreezeOverlay();
                }
            } else {
                if (stallCount > 0) hideFreezeOverlay();
                stallCount = 0;
            }
            lastPlaybackTime = ct;
        }, 1000);
    }

    var _freezeAutoRetryTimer = null;
    function showFreezeOverlay() {
        if (document.getElementById('freezeOverlay')) return;
        const div = document.createElement('div');
        div.id = 'freezeOverlay';
        div.className = 'freeze-overlay';
        div.setAttribute('data-testid', 'freeze-overlay');
        div.onclick = () => { hideFreezeOverlay(); retryStream(); };
        div.innerHTML = '<svg width="56" height="56" viewBox="0 0 24 24" fill="var(--cyan)"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg><div class="freeze-text">YAYIN DONDU</div><div class="freeze-sub">Tıkla veya bekle, otomatik yenilenecek...</div>';
        document.querySelector('.video-wrapper').appendChild(div);
        
        // Auto retry after 5s (çift retry önlendi)
        if (_freezeAutoRetryTimer) clearTimeout(_freezeAutoRetryTimer);
        _freezeAutoRetryTimer = setTimeout(() => {
            _freezeAutoRetryTimer = null;
            if (document.getElementById('freezeOverlay')) {
                hideFreezeOverlay();
                retryStream();
            }
        }, 5000);
    }

    function hideFreezeOverlay() {
        const el = document.getElementById('freezeOverlay');
        if (el) el.remove();
        if (_freezeAutoRetryTimer) { clearTimeout(_freezeAutoRetryTimer); _freezeAutoRetryTimer = null; }
    }

    function retryStream() {
        hideFreezeOverlay();
        stallCount = 0;
        retryCount = 0;
        setupStream(true); // Preroll atla (aynı kanal retry)
    }

    // ============================================
    // MAÇ MERKEZİ
    // ============================================
    const LEAGUES = {
        '4339': 'SÜPER LİG',
        '4480': 'ŞAMPİYONLAR LİGİ',
        '4332': 'SERİE A',
        '4331': 'BUNDESLIGA',
        '4335': 'LA LİGA',
        '4328': 'PREMİER LİG'
    };
    let allMatches = [];
    let activeLeague = 'all';

    async function fetchAllMatches() {
        allMatches = [];
        const grid = document.getElementById('matchesGrid');
        
        // LiveScore API - gerçek zamanlı maç verisi
        const LIVESCORE_LEAGUES = {
            'super-lig': {id: 'all', name: 'SÜPER LİG', filter: 'Turkish Super Lig'},
            'champions-league': {id: 'all', name: 'ŞAMPİYONLAR LİGİ', filter: 'Champions League'},
            'serie-a': {id: 'all', name: 'SERİE A', filter: 'Serie A'},
            'bundesliga': {id: 'all', name: 'BUNDESLIGA', filter: 'Bundesliga'},
            'la-liga': {id: 'all', name: 'LA LİGA', filter: 'LaLiga'},
            'premier-lig': {id: 'all', name: 'PREMİER LİG', filter: 'Premier League'}
        };

        const leagueIdMap = {
            'Turkish Super Lig': '4339', 'Trendyol Süper Lig': '4339', 'Super Lig': '4339',
            'Champions League': '4480', 'UEFA Champions League': '4480',
            'Serie A': '4332', 'Serie A TIM': '4332',
            'Bundesliga': '4331', '1. Bundesliga': '4331',
            'LaLiga': '4335', 'La Liga': '4335', 'LaLiga EA Sports': '4335',
            'Premier League': '4328'
        };
        
        try {
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');
            
            const matchesUrl = (BACKEND_URL || '') + '/api/livescore/today';
            const resp = await fetch(matchesUrl);
            if (resp.ok) {
                const data = await resp.json();
                const stages = data.Stages || [];
                
                for (const stage of stages) {
                    const leagueName = stage.Snm || '';
                    const country = stage.Cnm || '';
                    
                    // Lig filtreleme
                    let matchedLeague = null;
                    let matchedLeagueId = 'other';
                    
                    // Ülke ve lig eşleştirme
                    const countryLower = country.toLowerCase();
                    const leagueNameLower = leagueName.toLowerCase();
                    const combined = (leagueNameLower + ' ' + countryLower);
                    
                    if ((countryLower.includes('turk') || countryLower.includes('türk')) && (leagueNameLower.includes('süper') || leagueNameLower.includes('super lig')) && !leagueNameLower.includes('women')) {
                        matchedLeague = leagueName; matchedLeagueId = '4339';
                    } else if ((countryLower.includes('turk') || countryLower.includes('türk')) && (leagueNameLower.includes('cup') || leagueNameLower.includes('kupa')) && !leagueNameLower.includes('women') && !leagueNameLower.includes('kadın') && !leagueNameLower.includes('u19') && !leagueNameLower.includes('u21') && !leagueNameLower.includes('youth') && !leagueNameLower.includes('futsal')) {
                        matchedLeague = leagueName; matchedLeagueId = 'trcup';
                    } else if (combined.includes('champions league') && !combined.includes('afc') && !combined.includes('caf') && !combined.includes('asia') && !combined.includes('concacaf') && !combined.includes('women') && !combined.includes('youth') && !combined.includes('u19') && !combined.includes('u20') && !combined.includes('u21')) {
                        matchedLeague = leagueName + ' (' + country + ')'; matchedLeagueId = '4480';
                    } else if (combined.includes('europa league') && !combined.includes('asia') && !combined.includes('women') && !combined.includes('youth') && !combined.includes('u19') && !combined.includes('u20') && !combined.includes('u21')) {
                        matchedLeague = leagueName + ' (' + country + ')'; matchedLeagueId = '4480';
                    } else if (leagueNameLower === 'serie a' && countryLower.includes('ital')) {
                        matchedLeague = leagueName; matchedLeagueId = '4332';
                    } else if (leagueNameLower === 'bundesliga' && countryLower.includes('german')) {
                        // SADECE üst lig - "2. Bundesliga", "Frauen-Bundesliga", "Bundesliga 2" hariç
                        matchedLeague = leagueName; matchedLeagueId = '4331';
                    } else if (leagueNameLower === 'laliga' && countryLower.includes('spain')) {
                        // SADECE üst lig - "LaLiga 2" hariç
                        matchedLeague = leagueName; matchedLeagueId = '4335';
                    } else if (leagueNameLower === 'copa del rey' && countryLower.includes('spain')) {
                        matchedLeague = leagueName; matchedLeagueId = '4335';
                    } else if (leagueNameLower === 'premier league' && countryLower.includes('england')) {
                        matchedLeague = leagueName; matchedLeagueId = '4328';
                    } else if (leagueNameLower === 'ligue 1' && countryLower.includes('france')) {
                        matchedLeague = leagueName; matchedLeagueId = 'ligue1';
                    }
                    
                    if (!matchedLeague) continue; // Sadece büyük ligler
                    
                    for (const evt of (stage.Events || [])) {
                        const t1 = (evt.T1 || [{}])[0];
                        const t2 = (evt.T2 || [{}])[0];
                        const eps = evt.Eps || 'NS';
                        
                        // Biten maçları 10dk sonra atla
                        if (eps === 'FT' || eps === 'AP' || eps === 'AET' || eps === 'Pen.') {
                            var endTime = evt.Esd ? parseInt(String(evt.Esd).substring(8,10))*60 + parseInt(String(evt.Esd).substring(10,12)) + 6*60 + 105 : 0;
                            var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                            if (endTime > 0 && nowMin > endTime + 10) continue; // 10dk geçtiyse gösterme
                        }
                        
                        let status = 'BAŞLAMADI';
                        if (eps === 'NS') status = 'BAŞLAMADI';
                        else if (eps === 'HT') status = 'DEVRE ARASI';
                        else if (eps === 'FT' || eps === 'AP' || eps === 'AET' || eps === 'Pen.') status = 'MAÇ SONU';
                        else if (eps === 'ET' || eps === 'EP') status = 'UZATMA';
                        else if (eps.includes("'")) status = eps;
                        else if (eps === 'Postp.') status = 'ERTELENDİ';
                        else status = eps;
                        
                        // Saat bilgisi (LiveScore UTC-3 → Türkiye UTC+3 = +6 saat fark)
                        const matchTime = evt.Esd ? String(evt.Esd).substring(8, 10) + ':' + String(evt.Esd).substring(10, 12) : '';
                        if (status === 'BAŞLAMADI' && matchTime) {
                            let h = parseInt(matchTime.substring(0, 2)) + 6;
                            if (h >= 24) h -= 24;
                            status = 'MAÇ ÖNÜ - ' + String(h).padStart(2, '0') + ':' + matchTime.substring(3);
                        }
                        
                        allMatches.push({
                            leagueId: matchedLeagueId,
                            league: formatLeagueName(leagueName, country),
                            home: t1.Nm || '---',
                            away: t2.Nm || '---',
                            scoreH: evt.Tr1 !== undefined ? evt.Tr1 : null,
                            scoreA: evt.Tr2 !== undefined ? evt.Tr2 : null,
                            pen1: evt.Trp1,
                            pen2: evt.Trp2,
                            status: status,
                            time: matchTime
                        });
                    }
                }
            }
        } catch (err) {
            console.log('LiveScore API hatası:', err);
        }
        
        // Eğer LiveScore'dan veri gelmediyse TheSportsDB'ye fallback
        if (allMatches.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            for (const [id, name] of Object.entries(LEAGUES)) {
                try {
                    const resp = await fetch(SPORTS_API + '/eventsday.php?d=' + today + '&l=' + id);
                    if (resp.ok) {
                        const data = await resp.json();
                        for (const e of (data.events || [])) {
                            allMatches.push({
                                leagueId: id, league: name,
                                home: e.strHomeTeam || '---', away: e.strAwayTeam || '---',
                                scoreH: e.intHomeScore, scoreA: e.intAwayScore,
                                status: getStatus(e), time: e.strTime || ''
                            });
                        }
                    }
                } catch (err) {}
            }
        }
        
        // Yarınki maçları da çek
        try {
            var tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            var tmrStr = tomorrow.getFullYear() + String(tomorrow.getMonth()+1).padStart(2,'0') + String(tomorrow.getDate()).padStart(2,'0');
            var tmrUrl = (BACKEND_URL || '') + '/api/livescore/tomorrow';
            // Backend'de yoksa direkt yarın tarihli API çağır
            if (!BACKEND_URL) tmrUrl = '/api/livescore/today'; // Vercel'de aynı endpoint
            try {
                var tmrResp = await fetch((BACKEND_URL || '') + '/api/livescore/date/' + tmrStr);
                if (tmrResp.ok) {
                    var tmrData = await tmrResp.json();
                    var tmrStages = tmrData.Stages || [];
                    for (var ti = 0; ti < tmrStages.length; ti++) {
                        var ts = tmrStages[ti], tcn = (ts.Cnm||'').toLowerCase(), tsn = (ts.Snm||'').toLowerCase();
                        var isTR = tcn.includes('turk') || tcn.includes('türk');
                        // SADECE Süper Lig veya Türkiye Kupası - TFF 1/2. Lig hariç
                        if (!isTR) continue;
                        var isMainTR = tsn.includes('süper') || tsn.includes('super lig') || tsn.includes('cup') || tsn.includes('kupa');
                        if (!isMainTR) continue;
                        for (var tj = 0; tj < (ts.Events||[]).length; tj++) {
                            var te = ts.Events[tj];
                            var tt1 = ((te.T1||[{}])[0].Nm||''), tt2 = ((te.T2||[{}])[0].Nm||'');
                            var tmt = te.Esd ? String(te.Esd).substring(8,10)+':'+String(te.Esd).substring(10,12) : '';
                            var tst = 'YARIN';
                            if (tmt) { var th=parseInt(tmt.substring(0,2))+6; if(th>=24)th-=24; tst='YARIN '+String(th).padStart(2,'0')+':'+tmt.substring(3); }
                            allMatches.push({
                                leagueId: '4339', league: formatLeagueName(ts.Snm, ts.Cnm),
                                home: tt1, away: tt2, scoreH: null, scoreA: null,
                                status: tst, time: tmt, isTomorrow: true
                            });
                        }
                    }
                }
            } catch(e) {}
        } catch(e) {}
        
        renderMatches();
    }

    function filterLeague(id) {
        activeLeague = id;
        document.querySelectorAll('.league-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.league === id);
        });
        renderMatches();
    }

    function renderMatches() {
        const grid = document.getElementById('matchesGrid');
        const filtered = activeLeague === 'all' ? allMatches : allMatches.filter(m => m.leagueId === activeLeague);
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:20px;grid-column:1/-1;">Bugün bu ligde maç yok</div>';
            return;
        }
        
        // Render edilen maç anahtarlarını tut (bildirim filtresi için)
        window._renderedMatchKeys = {};
        filtered.forEach(function(m) {
            window._renderedMatchKeys[m.home + '-' + m.away] = true;
        });
        
        grid.innerHTML = filtered.map((m, idx) => {
            const isLive = m.status.includes("'") || m.status === 'CANLI' || m.status === 'DEVRE ARASI' || m.status === '1. YARI' || m.status === '2. YARI';
            let score = m.scoreH !== null && m.scoreH !== undefined ? (m.scoreH + ' - ' + m.scoreA) : 'vs';
            // Penaltı skorları (p 3-1) parantez içinde ekle
            if (m.pen1 !== undefined && m.pen1 !== null && m.pen2 !== undefined && m.pen2 !== null) {
                score += ' <span class="pen-score">(p ' + m.pen1 + '-' + m.pen2 + ')</span>';
            }
            return '<div class="match-card" data-testid="match-card" data-match-idx="' + idx + '" onclick="window.openMatchDetail(' + idx + ')">' +
                '<div class="match-card-league">' + m.league + '</div>' +
                '<div class="match-card-teams">' +
                    '<div class="match-card-team">' + m.home + '</div>' +
                    '<div class="match-card-score">' + score + '</div>' +
                    '<div class="match-card-team" style="text-align:right">' + m.away + '</div>' +
                '</div>' +
                '<div class="match-card-status' + (isLive ? ' live' : '') + '">' + m.status + '</div>' +
            '</div>';
        }).join('');
        // filtered listesini window'a bağla
        window._currentMatchList = filtered;
    }
    
    // ============================================
    // MAÇKOLİK TARZI MAÇ DETAY MODAL
    // ============================================
    window.openMatchDetail = function(idx) {
        var m = (window._currentMatchList || [])[idx];
        if (!m) return;
        var container = document.getElementById('matchDetailContainer');
        if (!container) return;
        var score = m.scoreH !== null && m.scoreH !== undefined ? (m.scoreH + ' - ' + m.scoreA) : 'vs';
        var penStr = '';
        if (m.pen1 !== undefined && m.pen1 !== null && m.pen2 !== undefined && m.pen2 !== null) {
            penStr = '<div style="font-size:14px;color:var(--orange);margin-top:6px;letter-spacing:2px;">PENALTILAR: ' + m.pen1 + ' - ' + m.pen2 + '</div>';
        }
        var html = '<div class="match-detail-overlay" onclick="if(event.target===this)window.closeMatchDetail()">' +
            '<div class="match-detail-modal">' +
                '<div class="match-detail-header">' +
                    '<div class="match-detail-league">' + (m.league || '').toUpperCase() + '</div>' +
                    '<button class="match-detail-close" onclick="window.closeMatchDetail()" data-testid="match-detail-close">✕</button>' +
                '</div>' +
                '<div class="match-detail-scoreboard">' +
                    '<div class="md-teams">' +
                        '<div class="md-team-name left">' + m.home + '</div>' +
                        '<div class="md-score">' + score + '</div>' +
                        '<div class="md-team-name right">' + m.away + '</div>' +
                    '</div>' +
                    penStr +
                    '<div class="md-status">' + m.status + '</div>' +
                '</div>' +
                '<div id="mdStatsGrid" class="md-stats-grid"></div>' +
                '<div id="mdEvents" class="md-events">' +
                    '<div class="md-loading">Detay veriler yükleniyor...</div>' +
                '</div>' +
            '</div>' +
        '</div>';
        container.innerHTML = html;
        // ESC ile kapat
        document.addEventListener('keydown', _mdEsc);
        // Detayları backend'den çek
        loadMatchDetail(m);
    };
    
    window.closeMatchDetail = function() {
        var c = document.getElementById('matchDetailContainer');
        if (c) c.innerHTML = '';
        document.removeEventListener('keydown', _mdEsc);
    };
    
    function _mdEsc(e) { if (e.key === 'Escape') window.closeMatchDetail(); }
    
    async function loadMatchDetail(m) {
        try {
            // Eventi bul (takım isimlerine göre)
            var resp = await fetch((BACKEND_URL || '') + '/api/livescore/today');
            if (!resp.ok) return renderDetailFallback(m);
            var data = await resp.json();
            var stages = data.Stages || [];
            var found = null;
            for (var i = 0; i < stages.length && !found; i++) {
                var evs = stages[i].Events || [];
                for (var j = 0; j < evs.length; j++) {
                    var t1 = ((evs[j].T1||[{}])[0].Nm||'');
                    var t2 = ((evs[j].T2||[{}])[0].Nm||'');
                    if ((t1 === m.home && t2 === m.away) || (t1.includes(m.home) && t2.includes(m.away))) {
                        found = evs[j];
                        break;
                    }
                }
            }
            if (!found) return renderDetailFallback(m);
            
            // İstatistikleri + olaylar render et
            renderMatchStats(found, m);
            renderMatchEvents(found, m);
        } catch(e) {
            renderDetailFallback(m);
        }
    }
    
    function renderMatchStats(ev, m) {
        var grid = document.getElementById('mdStatsGrid');
        if (!grid) return;
        // LiveScore event icmal (gol/kart sayıları incidents'ten)
        var incs = ev.Incs || [];
        var stats = { goals1: 0, goals2: 0, yc1: 0, yc2: 0, rc1: 0, rc2: 0, pen1: 0, pen2: 0 };
        incs.forEach(function(inc) {
            var side = (inc.Nm === '2' || inc.T === 2) ? 2 : 1;
            var it = inc.IT;
            if (it === 4 || it === 'G') stats['goals' + side]++;
            else if (it === 6 || it === 'YC') stats['yc' + side]++;
            else if (it === 7 || it === 'RC') stats['rc' + side]++;
            else if (it === 9 || it === 'P') stats['pen' + side]++;
        });
        var rows = [
            { label: 'GOLLER', v1: stats.goals1, v2: stats.goals2, icon: '⚽' },
            { label: 'SARI KART', v1: stats.yc1, v2: stats.yc2, icon: '🟨' },
            { label: 'KIRMIZI KART', v1: stats.rc1, v2: stats.rc2, icon: '🟥' },
            { label: 'PENALTI', v1: stats.pen1, v2: stats.pen2, icon: '⚡' }
        ];
        grid.innerHTML = rows.map(function(r) {
            return '<div class="md-stat-card">' +
                '<div class="md-stat-icon">' + r.icon + '</div>' +
                '<div class="md-stat-body">' +
                    '<div class="md-stat-label">' + r.label + '</div>' +
                    '<div class="md-stat-value">' + r.v1 + ' - ' + r.v2 + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    function renderMatchEvents(ev, m) {
        var wrap = document.getElementById('mdEvents');
        if (!wrap) return;
        var incs = ev.Incs || [];
        if (!incs.length) {
            wrap.innerHTML = '<div class="md-events-title">OLAYLAR</div><div class="md-loading">Henüz olay yok</div>';
            return;
        }
        // Zaman sırasına göre sırala (dakikaya göre)
        incs.sort(function(a, b) { return (parseInt(a.Min||a.Mn||0)) - (parseInt(b.Min||b.Mn||0)); });
        var html = '<div class="md-events-title">OLAYLAR</div>';
        incs.forEach(function(inc) {
            var it = inc.IT;
            var type = 'info', icon = '•', label = '';
            if (it === 4 || it === 'G') { type = 'goal'; icon = '⚽'; label = 'GOL'; }
            else if (it === 6 || it === 'YC') { type = 'yellowcard'; icon = '🟨'; label = 'SARI KART'; }
            else if (it === 7 || it === 'RC') { type = 'redcard'; icon = '🟥'; label = 'KIRMIZI KART'; }
            else if (it === 9 || it === 'P') { type = 'penalty'; icon = '⚡'; label = 'PENALTI'; }
            else { label = 'OLAY'; }
            var side = (inc.Nm === '2' || inc.T === 2) ? 2 : 1;
            var teamName = side === 1 ? m.home : m.away;
            var player = inc.P1 || inc.Player || 'Oyuncu';
            var min = (inc.Min || inc.Mn || 0) + "'";
            html += '<div class="md-event-row ' + type + '">' +
                '<div class="md-event-minute">' + min + '</div>' +
                '<div class="md-event-icon">' + icon + '</div>' +
                '<div class="md-event-desc">' + label + ': <strong>' + player + '</strong></div>' +
                '<div class="md-event-team">' + teamName + '</div>' +
            '</div>';
        });
        wrap.innerHTML = html;
    }
    
    function renderDetailFallback(m) {
        var wrap = document.getElementById('mdEvents');
        if (wrap) wrap.innerHTML = '<div class="md-events-title">OLAYLAR</div><div class="md-loading">Bu maç için detay veri bulunamadı. Maç henüz başlamadıysa olaylar canlı yayın sırasında burada görünecek.</div>';
    }

    // ============================================
    // INIT
    // ============================================
    // Window'a bağla (inline onclick erişimi)
    window.togglePlay = togglePlay;
    window.toggleMute = toggleMute;
    window.setVolume = setVolume;
    window.togglePiP = togglePiP;
    window.toggleFullscreen = toggleFullscreen;
    window.startCast = startCast;
    window.toggleQualityMenu = toggleQualityMenu;
    window.setQuality = setQuality;
    window.setupStream = setupStream;
    window.filterLeague = filterLeague;
    window.retryStream = retryStream;

    // ============================================
    // GLOBAL ALTYAZI CC SEÇİCİ (tüm kanallar)
    // ============================================
    function getCcLang() {
        try { return localStorage.getItem('bb_sub_lang') || (window._siteLang || 'tr'); } catch(e){ return 'tr'; }
    }
    function setCcLang(lang, userInitiated) {
        try { localStorage.setItem('bb_sub_lang', lang); } catch(e){}
        // Kullanıcı manuel değiştirdiyse flag ayarla (sunucu değişiminde override edilmesin)
        if (userInitiated) {
            try { localStorage.setItem('bb_sub_lang_user_set', '1'); } catch(e){}
        }
        updateCcUI();
        // Aktif iframe (YT veya Dailymotion) varsa src'yi yenile
        var ytWrap = document.getElementById('ytIframe');
        var iframe = ytWrap ? ytWrap.querySelector('iframe') : null;
        var ch = CHANNELS[currentChannel];
        if (iframe && ch) {
            var ccOn = (lang !== 'off');
            var useLang = ccOn ? lang : 'tr';
            if (ch.isDailymotion && ch.dmId) {
                iframe.src = 'https://www.dailymotion.com/embed/video/' + ch.dmId +
                    '?autoplay=1&mute=' + (isMuted?'1':'0') + '&ui-logo=0&ui-start-screen-info=0&ui-highlight=00f0ff&queue-enable=0&sharing-enable=0&endscreen-enable=0' +
                    '&subtitles-default=' + (ccOn ? useLang : '');
            } else if (ch.isYoutube && ch.youtubeId) {
                iframe.src = 'https://www.youtube-nocookie.com/embed/' + ch.youtubeId +
                    '?autoplay=1&mute=' + (isMuted?'1':'0') + '&controls=1&rel=0&modestbranding=1&playsinline=1' +
                    '&iv_load_policy=3&fs=1' +
                    '&cc_load_policy=' + (ccOn?'1':'0') + '&cc_lang_pref=' + useLang + '&hl=' + useLang +
                    '&playlist=' + ch.youtubeId + '&loop=1';
            }
        }
        // Video textTracks: OFF seçiliyse TÜM track'leri tamamen disable (eski hata: 'disabled' mode'u bazı tarayıcılarda göstermeye devam edebiliyor)
        if (video && video.textTracks) {
            for (var i = 0; i < video.textTracks.length; i++) {
                var tr = video.textTracks[i];
                if (lang === 'off') {
                    tr.mode = 'disabled';
                    // CSS fallback: track DOM elementini de display:none yap
                    try {
                        var trackEls = video.querySelectorAll('track');
                        trackEls.forEach(function(t){ t.style.display = 'none'; t.removeAttribute('default'); });
                    } catch(e){}
                } else if (tr.language === lang || (tr.language||'').toLowerCase().startsWith(lang)) {
                    tr.mode = 'showing';
                } else {
                    tr.mode = 'disabled';
                }
            }
        }
    }
    function updateCcUI() {
        var curr = getCcLang();
        document.querySelectorAll('.cc-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.sub === curr);
        });
    }
    function initCcSelector() {
        document.querySelectorAll('.cc-btn').forEach(function(b) {
            b.addEventListener('click', function() { setCcLang(b.dataset.sub, true); }); // userInitiated=true
        });
        updateCcUI();
    }

    // ============================================
    // SHELBY BAŞLATMA EKRANI (autoplay yerine user-click)
    // ============================================
    var _sessionStarted = false;
    function initStartScreen() {
        var startOv = document.getElementById('startOverlay');
        var playBtn = document.getElementById('shelbyPlayBtn');
        if (!startOv || !playBtn) return;
        function startSession(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (_sessionStarted) return;
            _sessionStarted = true;
            startOv.classList.add('hidden');
            // Autoplay policy unlock: user gesture'la video'ya doğrudan dokun, audio context unlock et
            try {
                // 1. Video.muted=false set et (user gesture içinde)
                video.muted = false;
                isMuted = false;
                if (unmuteBtn) unmuteBtn.classList.add('hidden');
                // 2. Boş bir play().pause() ile audio unlock
                var _unlock = video.play();
                if (_unlock && _unlock.then) {
                    _unlock.then(function(){ video.pause(); }).catch(function(){
                        // Autoplay engellendi - muted kalabilir, unmute göster
                        video.muted = true;
                        isMuted = true;
                        if (unmuteBtn) unmuteBtn.classList.remove('hidden');
                    });
                }
                // 3. AudioContext unlock (şarkı için)
                try {
                    var _ac = new (window.AudioContext || window.webkitAudioContext)();
                    if (_ac.state === 'suspended') _ac.resume();
                } catch(err2){}
            } catch(err) {}
            setupStream();
        }
        playBtn.addEventListener('click', startSession);
        // Ekranın herhangi bir yerine tıklamak da başlatır
        startOv.addEventListener('click', startSession);
    }

    // ============================================
    // SUNUCU 1/2/3 DİL FARKLILAŞTIRMASI
    // Server 1: Türkçe ses + Türkçe altyazı
    // Server 2: İngilizce ses + altyazısız
    // Server 3: İngilizce ses + İngilizce altyazı (otomatik)
    // ============================================
    window.getServerLang = function(serverIdx) {
        if (serverIdx === 0) return { audio: 'tr', sub: 'tr', ccOn: true };
        if (serverIdx === 1) return { audio: 'en', sub: 'tr', ccOn: false };
        return { audio: 'en', sub: 'en', ccOn: true }; // Server 3 (EU) = EN + EN CC
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        // Video event listeners - play/pause senkronizasyonu
        video.addEventListener('play', syncPlayIcon);
        video.addEventListener('pause', syncPlayIcon);
        video.addEventListener('playing', syncPlayIcon);
        
        // i18n default uygula
        applyI18n();
        
        initChannelTabs();
        // AUTOPLAY YOK - Shelby başlatma ekranı gösterilir, kullanıcı play'e tıklayınca setupStream başlar
        initStartScreen();
        initCcSelector(); // Global altyazı TR/EN/OFF seçici
        connectWebSocket();
        updateConnectionIcon();
        fetchAllMatches();
        
        // Tek kaynaklı polling - self-scheduling setTimeout ile çakışma önlenir
        function liveScoreLoop() {
            fetchLiveScore().finally(function() {
                setTimeout(liveScoreLoop, 15000);
            });
        }
        function matchCenterLoop() {
            fetchAllMatches().finally(function() {
                setTimeout(matchCenterLoop, 60000);
            });
        }
        liveScoreLoop();
        setTimeout(matchCenterLoop, 60000);
        
        // Bildirim sistemi başlat
        if ('Notification' in window && Notification.permission === 'granted') {
            notificationsEnabled = true;
            updateNotifUI(true);
        } else if ('Notification' in window && Notification.permission === 'denied') {
            updateNotifUI(false);
        }
        
        // Sunucu event listeners
        document.querySelectorAll('.server-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.server);
                switchServer(idx);
            });
        });
        
        // League filter event listeners
        document.querySelectorAll('.league-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterLeague(btn.dataset.league);
            });
        });

        // FPS Sayacı (video üstünde, küçük)
        var fpsEl = document.createElement('div');
        fpsEl.id = 'fpsCounter';
        fpsEl.style.cssText = 'position:absolute;top:15px;right:60px;z-index:15;font-family:VT323,monospace;font-size:12px;color:var(--green);opacity:0.6;pointer-events:none;text-shadow:0 0 4px rgba(0,255,136,0.5);';
        document.querySelector('.video-wrapper').appendChild(fpsEl);
        var fpsFrames = 0, fpsLast = performance.now();
        function fpsLoop() {
            fpsFrames++;
            var now = performance.now();
            if (now - fpsLast >= 1000) {
                fpsEl.textContent = fpsFrames + ' FPS';
                fpsFrames = 0;
                fpsLast = now;
            }
            requestAnimationFrame(fpsLoop);
        }
        requestAnimationFrame(fpsLoop);
    });
