    // ============================================
    // BACKEND URL
    // ============================================
    const BACKEND_URL = (function() {
        const h = window.location.hostname;
        if (h.includes('vercel')) return '';
        if (h.includes('emergentagent')) return window.location.origin;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8001';
        return '';
    })();
    const IS_STATIC = !BACKEND_URL;

    // ============================================
    // STREAM SOURCES
    // ============================================
    const STREAMS = {
        test: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        trt1: 'https://tv-trt1.medya.trt.com.tr/master.m3u8',
        trthaber: 'https://tv-trthaber.medya.trt.com.tr/master.m3u8',
        trtspor: 'https://tv-trtspor1.medya.trt.com.tr/master.m3u8',
        tv8: 'https://tv8.daioncdn.net/tv8/tv8.m3u8?app=7ddc255a-ef47-4e81-ab14-c0e5f2949788&ce=3',
        demo: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        akamai: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
        apple: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8'
    };

    // Sunucu yedekleri - AYNI KANAL, FARKLI KAYNAK (bağlantı kesilince geçiş)
    const SERVER_ALTERNATIVES = {
        demo1: [STREAMS.test, STREAMS.test, STREAMS.test],
        demo2: [STREAMS.demo, STREAMS.demo, STREAMS.demo],
        trt1: [STREAMS.trt1, STREAMS.trt1, STREAMS.trt1],
        trthaber: [STREAMS.trthaber, STREAMS.trthaber, STREAMS.trthaber],
        trtspor: [STREAMS.trtspor, STREAMS.akamai, STREAMS.test],
        tv8: [STREAMS.tv8, STREAMS.tv8, STREAMS.tv8]
    };

    const CHANNELS = {
        demo1: { name: 'DEMO 1', status: 'online', stream: STREAMS.test },
        demo2: { name: 'DEMO 2', status: 'online', stream: STREAMS.demo, subtitles: 'tears-of-steel-tr.vtt' },
        reklam: { name: 'REKLAM', status: 'online', isAd: true },
        trt1: { name: 'TRT 1', status: 'online', stream: STREAMS.trt1 },
        trthaber: { name: 'TRT HABER', status: 'online', stream: STREAMS.trthaber },
        tv8: { name: 'TV 8', status: 'online', stream: STREAMS.tv8 },
        trtspor: { name: 'TRT SPOR', status: 'checking', stream: STREAMS.trtspor },
        bein1: { name: 'beIN SPORTS 1', status: 'maintenance', premium: true },
        bein2: { name: 'beIN SPORTS 2', status: 'maintenance', premium: true },
        ssport: { name: 'S SPORT', status: 'maintenance', premium: true },
        gstv: { name: 'GS TV', status: 'maintenance' },
        fbtv: { name: 'FB TV', status: 'maintenance' },
        atv: { name: 'ATV', status: 'maintenance' },
        aspor: { name: 'A SPOR', status: 'maintenance' }
    };

    const SPORTS_API = 'https://www.thesportsdb.com/api/v1/json/3';

    // ============================================
    // STATE
    // ============================================
    let currentChannel = 'demo1';
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
    function connectWebSocket() {
        if (IS_STATIC || !BACKEND_URL) { startHttpPolling(); return; }
        if (ws && ws.readyState === WebSocket.OPEN) return;
        
        const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/ws/scores';
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            wsReconnectAttempts = 0;
            setInterval(() => { if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping'); }, 25000);
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'score_update') {
                    // LiveScore'dan gerçek veri varsa, WebSocket'ten gelen default veriyi atla
                    const isDefault = (data.team1 === 'TÜRKİYE' && data.team2 === 'ROMANYA');
                    if (isDefault && hasLiveScoreData) return;
                    updateScoreboard(data);
                }
            } catch (e) {}
        };
        ws.onclose = () => {
            ws = null;
            if (wsReconnectAttempts < 5) { wsReconnectAttempts++; setTimeout(connectWebSocket, 3000); }
            else startHttpPolling();
        };
        ws.onerror = () => {};
    }

    function startHttpPolling() {
        if (httpPollingInterval) return;
        fetchLiveScore();
        httpPollingInterval = setInterval(fetchLiveScore, 60000);
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

    async function fetchLiveScore() {
        try {
            // LiveScore API - gerçek zamanlı
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');
            
            const resp = await fetch(BACKEND_URL + '/api/livescore/today');
            if (resp.ok) {
                const data = await resp.json();
                const stages = data.Stages || [];
                
                // Türk takımları ara
                const turkTeams = ['galatasaray', 'fenerbah', 'besiktas', 'beşiktaş', 'trabzonspor', 
                    'kocaelispor', 'samsunspor', 'antalyaspor', 'alanyaspor', 'kayserispor',
                    'kasımpaşa', 'sivasspor', 'turkey', 'türkiye', 'istanbul', 'göztepe', 'eyüp', 'adana'];
                
                let bestMatch = null;
                let bestPriority = 0;
                
                for (const stage of stages) {
                    const country = (stage.Cnm || '').toLowerCase();
                    const leagueName = stage.Snm || '';
                    const isTurkishLeague = country.includes('turk') || country.includes('türk');
                    
                    for (const evt of (stage.Events || [])) {
                        const t1 = ((evt.T1 || [{}])[0].Nm || '').toLowerCase();
                        const t2 = ((evt.T2 || [{}])[0].Nm || '').toLowerCase();
                        const isTurkMatch = isTurkishLeague || turkTeams.some(t => t1.includes(t) || t2.includes(t));
                        
                        if (!isTurkMatch) continue;
                        
                        const eps = evt.Eps || 'NS';
                        let priority = 0;
                        let status = 'BAŞLAMADI';
                        
                        if (eps.includes("'") || eps === '1H' || eps === '2H') { priority = 3; status = eps; }
                        else if (eps === 'HT') { priority = 3; status = 'DEVRE ARASI'; }
                        else if (eps === 'FT') { priority = 1; status = 'MAÇ SONU'; }
                        else if (eps === 'NS') { priority = 2; 
                            const matchTime = evt.Esd ? String(evt.Esd).substring(8, 10) + ':' + String(evt.Esd).substring(10, 12) : '';
                            if (matchTime) {
                                let h = parseInt(matchTime.substring(0, 2)) + 6;
                                if (h >= 24) h -= 24;
                                status = 'MAÇ ÖNÜ - ' + String(h).padStart(2, '0') + ':' + matchTime.substring(3);
                            }
                        }
                        else { priority = 2; status = eps; }
                        
                        if (priority > bestPriority) {
                            bestPriority = priority;
                            bestMatch = {
                                team1: (evt.T1 || [{}])[0].Nm || '---',
                                team2: (evt.T2 || [{}])[0].Nm || '---',
                                score1: evt.Tr1 || 0, score2: evt.Tr2 || 0,
                                league: leagueName, status: status
                            };
                        }
                    }
                }
                
                if (bestMatch) { hasLiveScoreData = true; updateScoreboard(bestMatch); return; }
            }
        } catch (e) {
            console.log('LiveScore API hatası:', e);
        }
        
        // Fallback - backend
        try {
            if (BACKEND_URL) {
                const resp = await fetch(BACKEND_URL + '/api/scores/live');
                if (resp.ok) { updateScoreboard(await resp.json()); return; }
            }
        } catch (e) {}
        
        showDefaultMatch();
    }

    function showDefaultMatch() {
        updateScoreboard({ team1: 'TÜRKİYE', team2: 'ROMANYA', score1: 0, score2: 0,
            league: '2026 FİFA DÜNYA KUPASI ELEMELERİ', status: 'CANLI' });
    }

    function updateScoreboard(match) {
        document.getElementById('team1').textContent = match.team1 || '---';
        document.getElementById('team2').textContent = match.team2 || '---';
        document.getElementById('score1').textContent = match.score1 || 0;
        document.getElementById('score2').textContent = match.score2 || 0;
        document.getElementById('leagueInfo').textContent = match.league || 'SÜPER LİG';
        
        const status = match.status || 'CANLI';
        if (status === 'MAÇ SONU' || status === 'FT') {
            matchMinute.textContent = 'MAÇ SONU';
            matchMinute.className = 'match-minute ended';
            statusText.textContent = 'BİTTİ';
            statusBadge.className = 'live-badge ended';
        } else if (status === 'BAŞLAMADI' || status.includes('SONRAKİ')) {
            matchMinute.textContent = status;
            matchMinute.className = 'match-minute maintenance';
            statusText.textContent = 'YAKINDA';
            statusBadge.className = 'live-badge maintenance';
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
        if (enabled) {
            btn.classList.add('active');
            btn.querySelector('.notif-status').textContent = 'AÇIK';
        } else {
            btn.classList.remove('active');
            btn.querySelector('.notif-status').textContent = 'KAPALI';
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
        try {
            var n = new Notification(title, {
                body: body,
                icon: 'https://www.google.com/s2/favicons?domain=banbansports.com&sz=128',
                badge: 'https://www.google.com/s2/favicons?domain=banbansports.com&sz=64',
                tag: 'banban-' + type,
                renotify: true,
                silent: false
            });
            n.onclick = function() { window.focus(); n.close(); };
            setTimeout(function() { n.close(); }, 8000);
        } catch(e) {}
    }

    window.toggleNotifications = toggleNotifications;

    // ============================================
    // CHANNEL SELECTOR
    // ============================================
    function initChannelTabs() {
        document.querySelectorAll('.channel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const channel = tab.dataset.channel;
                document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentChannel = channel;
                currentServerIndex = 0;
                updateServerUI();
                
                const ch = CHANNELS[channel];
                if (!ch || ch.status === 'maintenance') {
                    // Önceki stream'i temizle
                    if (hls) { hls.destroy(); hls = null; }
                    if (crashCheckInterval) clearInterval(crashCheckInterval);
                    showMaintenance();
                    return;
                }
                hideAdOverlay();
                setupStream();
            });
        });
    }

    // ============================================
    // STREAM SETUP
    // ============================================
    const MAX_RETRIES = 3;

    function setupStream() {
        const channel = CHANNELS[currentChannel];
        if (!channel || channel.status === 'maintenance') { showMaintenance(); return; }

        // Clear overlays
        loadingOverlay.classList.remove('hidden');
        errorOverlay.classList.add('hidden');
        maintenanceOverlay.classList.add('hidden');
        hideFreezeOverlay();

        // Destroy previous HLS
        if (hls) { hls.destroy(); hls = null; }

        // Loading timeout - 15s sonra hala yüklenemezse hata göster
        const loadTimeout = setTimeout(() => {
            if (!loadingOverlay.classList.contains('hidden')) {
                console.log('Stream yükleme zaman aşımı');
                tryNextServer();
            }
        }, 15000);

        // REKLAM channel = Lokal video (20sn, bittikten sonra Play Store'a yönlendir)
        if (channel.isAd) {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
            if (hls) { hls.destroy(); hls = null; }
            video.removeAttribute('src');
            video.loop = false;
            video.muted = isMuted;
            // WebM for wider codec support, MP4 as fallback
            var cacheBust = '?v=' + Date.now();
            video.src = 'reklam.webm' + cacheBust;
            video.onerror = function() {
                if (video.src.includes('.webm')) {
                    video.src = 'reklam.mp4' + cacheBust;
                }
            };
            // Reklam bitince Play Store PUBG Mobile'a yönlendir
            video.onended = function() {
                window.open('https://play.google.com/store/apps/details?id=com.tencent.ig', '_blank');
            };
            video.load();
            video.play().catch(() => {});
            isPlaying = true;
            unmuteBtn.classList.toggle('hidden', !isMuted);
            updateQualityMenu([]);
            showAdOverlay();
            return;
        }

        // Get stream URL based on server index
        const servers = SERVER_ALTERNATIVES[currentChannel] || [];
        const streamUrl = servers[currentServerIndex] || channel.stream;
        if (!streamUrl) { showMaintenance(); return; }

        video.loop = false;
        video.removeAttribute('src');

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true, lowLatencyMode: false,
                backBufferLength: 30, maxBufferLength: 30, maxMaxBufferLength: 60,
                manifestLoadingTimeOut: 20000, manifestLoadingMaxRetry: 3,
                levelLoadingTimeOut: 20000, fragLoadingTimeOut: 30000
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
                clearTimeout(loadTimeout);
                loadingOverlay.classList.add('hidden');
                statusText.textContent = 'CANLI';
                statusBadge.className = 'live-badge';
                video.play().catch(() => {});
                isPlaying = true;
                retryCount = 0;
                unmuteBtn.classList.toggle('hidden', !isMuted);
                updateSubtitles();
                startCrashDetection();
                updateConnectionIcon();
                updateQualityMenu(hls.levels || []);
                // Reklam kanalıysa overlay göster
                if (CHANNELS[currentChannel] && CHANNELS[currentChannel].isAd) showAdOverlay();
            });

            hls.on(Hls.Events.ERROR, (e, data) => {
                if (!data.fatal) return;
                
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    const code = data.response && data.response.code;
                    if (code === 404 || code === 403) {
                        // Server dead or banned - try next server
                        tryNextServer();
                    } else if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        setTimeout(() => { if (hls) { hls.destroy(); hls = null; } setupStream(); }, 2000);
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

    function tryNextServer() {
        const servers = SERVER_ALTERNATIVES[currentChannel] || [];
        console.log('Sunucu geçişi deneniyor: ' + (currentServerIndex + 1) + '/' + servers.length);
        if (currentServerIndex < servers.length - 1) {
            currentServerIndex++;
            retryCount = 0;
            updateServerUI();
            if (hls) { hls.destroy(); hls = null; }
            console.log('Yeni sunucu: ' + servers[currentServerIndex]);
            setupStream();
        } else {
            console.log('Tüm sunucular denendi, bakım moduna geçiliyor');
            showMaintenance();
        }
    }

    function updateServerUI() {
        document.querySelectorAll('.server-item').forEach((item, i) => {
            item.classList.toggle('active', i === currentServerIndex);
            // Sunucu durumlarını güncelle
            const status = item.querySelector('.server-status');
            if (status) {
                const servers = SERVER_ALTERNATIVES[currentChannel] || [];
                if (i < servers.length) {
                    status.className = i === currentServerIndex ? 'server-status online' : 'server-status checking';
                } else {
                    status.className = 'server-status';
                }
            }
        });
    }

    // Window'a bağla (inline onclick erişimi için)
    window.switchServer = function(index) {
        currentServerIndex = index;
        retryCount = 0;
        updateServerUI();
        if (hls) { hls.destroy(); hls = null; }
        setupStream();
    };

    // ============================================
    // SUBTITLES
    // ============================================
    function updateSubtitles() {
        video.querySelectorAll('track').forEach(t => t.remove());
        const channel = CHANNELS[currentChannel];
        if (channel && channel.subtitles) {
            const track = document.createElement('track');
            track.kind = 'subtitles'; track.label = 'Turkce'; track.srclang = 'tr';
            track.src = channel.subtitles; track.default = true;
            video.appendChild(track);
            setTimeout(() => { if (video.textTracks.length > 0) video.textTracks[0].mode = 'showing'; }, 500);
        }
    }

    // ============================================
    // OVERLAYS
    // ============================================
    function showStreamError() {
        loadingOverlay.classList.add('hidden');
        maintenanceOverlay.classList.add('hidden');
        errorOverlay.classList.remove('hidden');
        hideAdOverlay();
    }

    function showMaintenance() {
        loadingOverlay.classList.add('hidden');
        errorOverlay.classList.add('hidden');
        maintenanceOverlay.classList.remove('hidden');
        statusBadge.className = 'live-badge maintenance';
        statusText.textContent = 'BAKIM';
        hideAdOverlay();
    }

    function showAdOverlay() {
        hideAdOverlay();
        const overlay = document.createElement('div');
        overlay.id = 'adOverlay';
        overlay.setAttribute('data-testid', 'ad-overlay');
        overlay.style.cssText = 'position:absolute;top:15px;left:15px;z-index:30;padding:8px 16px;background:linear-gradient(135deg,rgba(255,0,64,0.95),rgba(170,0,255,0.9));font-family:Orbitron,sans-serif;font-size:12px;font-weight:700;color:#fff;letter-spacing:2px;border:1px solid rgba(255,255,255,0.4);box-shadow:0 0 20px rgba(255,0,64,0.5);';
        overlay.textContent = 'REKLAM - PUBG MOBILE';
        document.querySelector('.video-wrapper').appendChild(overlay);
    }

    function hideAdOverlay() {
        const el = document.getElementById('adOverlay');
        if (el) el.remove();
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
        if (!isMuted) video.volume = 0.7;
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
        if (video.remote && typeof video.remote.prompt === 'function') {
            video.remote.prompt().catch(() => showCastHelp());
        } else if (video.webkitShowPlaybackTargetPicker) {
            video.webkitShowPlaybackTargetPicker();
        } else if (navigator.presentation && navigator.presentation.defaultRequest) {
            navigator.presentation.defaultRequest.start().catch(() => showCastHelp());
        } else {
            showCastHelp();
        }
    }

    function showCastHelp() {
        alert("TV'ye Yansıtma:\n\n- Chrome: Sağ tık > Yayınla\n- iPhone/iPad: Kontrol Merkezi > Ekran Yansıtma\n- Android: Bildirim çubuğu > Yayınla/Screen Cast\n- Smart TV: Tarayıcıdan bu adresi aç\n- Bluetooth: Telefonunuzun Bluetooth ayarlarından bağlanın");
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
                // 5G desteği
                if (conn.downlink && conn.downlink > 50) {
                    text.textContent = '5G';
                    text.style.color = 'var(--cyan)';
                } else if (eff === '4g' || (conn.downlink && conn.downlink > 5)) {
                    text.textContent = '4G';
                    text.style.color = 'var(--green)';
                } else if (eff === '3g') {
                    text.textContent = '3G';
                    text.style.color = 'var(--orange)';
                } else {
                    text.textContent = '2G';
                    text.style.color = 'var(--red)';
                }
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
    const STALL_THRESHOLD = 5;  // 5 seconds = short freeze
    const CRASH_THRESHOLD = 15; // 15 seconds = long crash -> maintenance

    function startCrashDetection() {
        if (crashCheckInterval) clearInterval(crashCheckInterval);
        stallCount = 0;
        lastPlaybackTime = video.currentTime;

        // Video event-based detection (daha güvenilir)
        video.addEventListener('waiting', () => {
            console.log('Video buffering...');
        });
        
        video.addEventListener('stalled', () => {
            console.log('Video stalled - ağ sorunu olabilir');
        });

        video.addEventListener('error', (e) => {
            console.log('Video error:', e);
            // m3u8 çökmesi, 404, 403 gibi durumlar
            if (video.error) {
                const code = video.error.code;
                // MEDIA_ERR_NETWORK veya MEDIA_ERR_SRC_NOT_SUPPORTED
                if (code === 2 || code === 4) {
                    console.log('Ciddi video hatası - sunucu geçişi deneniyor');
                    tryNextServer();
                }
            }
        });

        crashCheckInterval = setInterval(() => {
            if (!video || video.paused || !isPlaying) return;
            
            const ct = video.currentTime;
            if (Math.abs(ct - lastPlaybackTime) < 0.1) {
                stallCount++;
                
                if (stallCount >= CRASH_THRESHOLD) {
                    // 15+ saniye donma -> önce sunucu geçişi dene, son çare bakım
                    console.log('15sn+ donma algılandı - sunucu geçişi deneniyor');
                    clearInterval(crashCheckInterval);
                    hideFreezeOverlay();
                    tryNextServer();
                } else if (stallCount >= STALL_THRESHOLD) {
                    // 5 saniye donma -> yenileme ikonu göster
                    console.log('5sn donma algılandı - yenile butonu gösteriliyor');
                    showFreezeOverlay();
                }
            } else {
                if (stallCount > 0) hideFreezeOverlay();
                stallCount = 0;
            }
            lastPlaybackTime = ct;
        }, 1000);
    }

    function showFreezeOverlay() {
        if (document.getElementById('freezeOverlay')) return;
        const div = document.createElement('div');
        div.id = 'freezeOverlay';
        div.className = 'freeze-overlay';
        div.setAttribute('data-testid', 'freeze-overlay');
        div.onclick = () => { hideFreezeOverlay(); retryStream(); };
        div.innerHTML = '<svg width="56" height="56" viewBox="0 0 24 24" fill="var(--cyan)"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg><div class="freeze-text">YAYIN DONDU</div><div class="freeze-sub">Tıkla veya bekle, otomatik yenilenecek...</div>';
        document.querySelector('.video-wrapper').appendChild(div);
        
        // Auto retry after 5s
        setTimeout(() => {
            if (document.getElementById('freezeOverlay')) {
                hideFreezeOverlay();
                retryStream();
            }
        }, 5000);
    }

    function hideFreezeOverlay() {
        const el = document.getElementById('freezeOverlay');
        if (el) el.remove();
    }

    function retryStream() {
        hideFreezeOverlay();
        stallCount = 0;
        retryCount = 0;
        setupStream();
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
            
            const resp = await fetch(BACKEND_URL + '/api/livescore/today');
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
                    
                    if ((countryLower.includes('turk') || countryLower.includes('türk')) && leagueNameLower.includes('süper')) {
                        matchedLeague = leagueName; matchedLeagueId = '4339';
                    } else if (leagueNameLower.includes('champions league') && countryLower === 'world') {
                        matchedLeague = leagueName; matchedLeagueId = '4480';
                    } else if (leagueNameLower === 'serie a' && countryLower.includes('ital')) {
                        matchedLeague = leagueName; matchedLeagueId = '4332';
                    } else if (leagueNameLower === 'bundesliga' && countryLower.includes('german')) {
                        matchedLeague = leagueName; matchedLeagueId = '4331';
                    } else if (leagueNameLower.includes('laliga') && countryLower.includes('spain')) {
                        matchedLeague = leagueName; matchedLeagueId = '4335';
                    } else if (leagueNameLower === 'premier league' && countryLower.includes('england')) {
                        matchedLeague = leagueName; matchedLeagueId = '4328';
                    }
                    
                    if (!matchedLeague) continue; // Sadece büyük ligler
                    
                    for (const evt of (stage.Events || [])) {
                        const t1 = (evt.T1 || [{}])[0];
                        const t2 = (evt.T2 || [{}])[0];
                        const eps = evt.Eps || 'NS';
                        
                        let status = 'BAŞLAMADI';
                        if (eps === 'NS') status = 'BAŞLAMADI';
                        else if (eps === 'HT') status = 'DEVRE ARASI';
                        else if (eps === 'FT') status = 'MAÇ SONU';
                        else if (eps === 'AP') status = 'UZATMA SONU';
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
                            league: leagueName + ' (' + country + ')',
                            home: t1.Nm || '---',
                            away: t2.Nm || '---',
                            scoreH: evt.Tr1 !== undefined ? evt.Tr1 : null,
                            scoreA: evt.Tr2 !== undefined ? evt.Tr2 : null,
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
        
        renderMatches();
        
        // Her 60 saniyede güncelle
        setTimeout(fetchAllMatches, 60000);
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
        
        grid.innerHTML = filtered.map(m => {
            const isLive = m.status.includes("'") || m.status === 'CANLI' || m.status === 'DEVRE ARASI' || m.status === '1. YARI' || m.status === '2. YARI';
            const score = m.scoreH !== null && m.scoreH !== undefined ? (m.scoreH + ' - ' + m.scoreA) : 'vs';
            return '<div class="match-card">' +
                '<div class="match-card-league">' + m.league + '</div>' +
                '<div class="match-card-teams">' +
                    '<div class="match-card-team">' + m.home + '</div>' +
                    '<div class="match-card-score">' + score + '</div>' +
                    '<div class="match-card-team" style="text-align:right">' + m.away + '</div>' +
                '</div>' +
                '<div class="match-card-status' + (isLive ? ' live' : '') + '">' + m.status + '</div>' +
            '</div>';
        }).join('');
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
    
    document.addEventListener('DOMContentLoaded', () => {
        // Video event listeners - play/pause senkronizasyonu
        video.addEventListener('play', syncPlayIcon);
        video.addEventListener('pause', syncPlayIcon);
        video.addEventListener('playing', syncPlayIcon);
        
        initChannelTabs();
        setupStream();
        connectWebSocket();
        fetchLiveScore();
        updateConnectionIcon();
        fetchAllMatches();
        
        // Bildirim sistemi başlat
        if ('Notification' in window && Notification.permission === 'granted') {
            notificationsEnabled = true;
            updateNotifUI(true);
        }
        
        // Sunucu event listeners
        document.querySelectorAll('.server-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.server);
                currentServerIndex = idx;
                retryCount = 0;
                updateServerUI();
                if (hls) { hls.destroy(); hls = null; }
                setupStream();
            });
        });
        
        // League filter event listeners
        document.querySelectorAll('.league-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterLeague(btn.dataset.league);
            });
        });
    });
