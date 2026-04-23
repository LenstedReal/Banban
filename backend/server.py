from fastapi import FastAPI, APIRouter, HTTPException, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime, timezone
import httpx
import re
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# S Sport credentials (NEVER expose to frontend)
SSPORT_EMAIL = os.environ.get('SSPORT_EMAIL', '')
SSPORT_PASSWORD = os.environ.get('SSPORT_PASSWORD', '')
SSPORT_MEMBER_ID = os.environ.get('SSPORT_MEMBER_ID', '')

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.last_score_data = None
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if self.last_score_data:
            await websocket.send_json(self.last_score_data)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, data: dict):
        self.last_score_data = data
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Turkish teams list
TURKISH_TEAMS = [
    'Galatasaray', 'Fenerbahce', 'Fenerbahçe', 'Besiktas', 'Beşiktaş',
    'Trabzonspor', 'Istanbul', 'İstanbul', 'Kasimpasa', 'Kasımpaşa',
    'Samsunspor', 'Antalyaspor', 'Konyaspor', 'Sivasspor', 'Rizespor',
    'Alanyaspor', 'Kayserispor', 'Gaziantep', 'Hatayspor', 'Adana',
    'Goztepe', 'Göztep', 'Eyüpspor', 'Pendikspor', 'Bodrum',
    'Turkey', 'Türkiye', 'Başakşehir', 'Basaksehir'
]

def is_turkish_team(name):
    name_lower = name.lower()
    return any(t.lower() in name_lower for t in TURKISH_TEAMS)

def format_match_status(event):
    status = event.get("strStatus") or event.get("strProgress") or ""
    if "HT" in status or status == "Halftime":
        return "DEVRE ARASI"
    if "FT" in status or status == "Match Finished":
        return "MAÇ SONU"
    if "'" in status or "min" in status.lower():
        return status
    if status == "1H":
        return "1. YARI"
    if status == "2H":
        return "2. YARI"
    if status in ["NS", "Not Started"]:
        return "BAŞLAMADI"
    match = re.search(r'(\d+)', status)
    if match:
        return f"{match.group(1)}'"
    return "CANLI"

# ============================================
# WebSocket - Live Score Broadcast
# ============================================
async def fetch_live_scores():
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            
            # 1. Check live events first
            try:
                live_resp = await http_client.get(
                    'https://www.thesportsdb.com/api/v1/json/3/eventslive.php',
                    headers=headers
                )
                if live_resp.status_code == 200:
                    data = live_resp.json()
                    events = [e for e in (data.get("events") or []) if e.get("strSport") in ["Soccer", "Football"]]
                    for event in events:
                        home = event.get("strHomeTeam", "")
                        away = event.get("strAwayTeam", "")
                        if is_turkish_team(home) or is_turkish_team(away):
                            return {
                                "type": "score_update",
                                "team1": home, "team2": away,
                                "score1": int(event.get("intHomeScore") or 0),
                                "score2": int(event.get("intAwayScore") or 0),
                                "league": event.get("strLeague", "FUTBOL"),
                                "status": format_match_status(event),
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            }
            except Exception:
                pass
            
            # 2. Today's Süper Lig matches
            try:
                sl_resp = await http_client.get(
                    f'https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d={today}&l=4339',
                    headers=headers
                )
                if sl_resp.status_code == 200:
                    data = sl_resp.json()
                    events = [e for e in (data.get("events") or [])
                              if is_turkish_team(e.get("strHomeTeam", "")) or is_turkish_team(e.get("strAwayTeam", ""))]
                    if events:
                        best = max(events, key=lambda e: 3 if "'" in (e.get("strStatus") or "") else 2 if e.get("strStatus") == "NS" else 1)
                        return {
                            "type": "score_update",
                            "team1": best.get("strHomeTeam"), "team2": best.get("strAwayTeam"),
                            "score1": int(best.get("intHomeScore") or 0),
                            "score2": int(best.get("intAwayScore") or 0),
                            "league": "SÜPER TOTO SÜPER LİG",
                            "status": format_match_status(best),
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
            except Exception:
                pass
            
            # 3. Today's Champions League (Turkish teams)
            try:
                cl_resp = await http_client.get(
                    f'https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d={today}&l=4480',
                    headers=headers
                )
                if cl_resp.status_code == 200:
                    data = cl_resp.json()
                    for event in (data.get("events") or []):
                        if is_turkish_team(event.get("strHomeTeam", "")) or is_turkish_team(event.get("strAwayTeam", "")):
                            return {
                                "type": "score_update",
                                "team1": event.get("strHomeTeam"), "team2": event.get("strAwayTeam"),
                                "score1": int(event.get("intHomeScore") or 0),
                                "score2": int(event.get("intAwayScore") or 0),
                                "league": "UEFA ŞAMPİYONLAR LİGİ",
                                "status": format_match_status(event),
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            }
            except Exception:
                pass
            
            # 4. Next Süper Lig match (eventsseason - NOT eventsnextleague which is buggy)
            try:
                season_resp = await http_client.get(
                    'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4339&s=2024-2025',
                    headers=headers
                )
                if season_resp.status_code == 200:
                    data = season_resp.json()
                    upcoming = sorted(
                        [e for e in (data.get("events") or [])
                         if e.get("dateEvent", "") >= today and e.get("strStatus") not in ["Match Finished", "FT"]],
                        key=lambda e: e.get("dateEvent", "")
                    )
                    if upcoming:
                        event = upcoming[0]
                        evt_time = event.get("strTime", "00:00:00")
                        try:
                            h = int(evt_time[:2]) + 3
                            if h >= 24: h -= 24
                            tr_time = f"{h:02d}:{evt_time[3:5]}"
                        except Exception:
                            tr_time = evt_time[:5]
                        return {
                            "type": "score_update",
                            "team1": event.get("strHomeTeam"), "team2": event.get("strAwayTeam"),
                            "score1": 0, "score2": 0,
                            "league": "SÜPER TOTO SÜPER LİG",
                            "status": f"SONRAKİ - {event.get('dateEvent')} {tr_time}",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
            except Exception:
                pass
    except Exception as e:
        logger.error(f"Live score fetch error: {e}")
    
    return {
        "type": "score_update",
        "team1": "TÜRKİYE", "team2": "ROMANYA",
        "score1": 0, "score2": 0,
        "league": "2026 FIFA DÜNYA KUPASI ELEMELERİ",
        "status": "CANLI",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

score_update_task = None

async def score_broadcast_loop():
    while True:
        try:
            score_data = await fetch_live_scores()
            if manager.active_connections:
                await manager.broadcast(score_data)
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
        await asyncio.sleep(30)

@app.on_event("startup")
async def startup_event():
    global score_update_task
    score_update_task = asyncio.create_task(score_broadcast_loop())
    logger.info("Score broadcast loop started")

@app.on_event("shutdown")
async def shutdown_event():
    global score_update_task
    if score_update_task:
        score_update_task.cancel()
    client.close()

# WebSocket Endpoint
@api_router.websocket("/ws/scores")
async def websocket_scores(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# ============================================
# Score API (HTTP fallback)
# ============================================
@api_router.get("/scores/live")
async def get_live_scores():
    score = await fetch_live_scores()
    return score

# ============================================
# LiveScore Proxy (CORS bypass)
# ============================================
@api_router.get("/livescore/today")
async def livescore_today():
    """Proxy LiveScore API for today's matches - bypasses CORS"""
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(
                f"https://prod-public-api.livescore.com/v1/api/app/date/soccer/{date_str}/-3?MD=1",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if resp.status_code == 200:
                return resp.json()
            return {"Stages": []}
    except Exception as e:
        logger.error(f"LiveScore proxy error: {e}")
        return {"Stages": []}

# ============================================
# Channel Management
# ============================================
@api_router.get("/channels")
async def get_channels():
    """Return all channel statuses"""
    channels = {
        "demo1": {"name": "SİNTEL TRAILER", "status": "online"},
        "demo2": {"name": "TEARS OF STEEL TRAILER", "status": "online"},
        "demo3": {"name": "BIG BUCK BUNNY TRAILER", "status": "online"},
        "trt1": {"name": "TRT 1", "status": "online"},
        "trthaber": {"name": "TRT HABER", "status": "online"},
        "tv8": {"name": "TV 8", "status": "online"},
        "trtspor": {"name": "TRT SPOR", "status": "checking"},
        "bein1": {"name": "beIN SPORTS 1", "status": "maintenance", "premium": True},
        "bein2": {"name": "beIN SPORTS 2", "status": "maintenance", "premium": True},
        "ssport": {"name": "S SPORT", "status": "maintenance", "premium": True},
        "gstv": {"name": "GS TV", "status": "maintenance"},
        "fbtv": {"name": "FB TV", "status": "maintenance"},
        "atv": {"name": "ATV", "status": "maintenance"},
        "aspor": {"name": "A SPOR", "status": "maintenance"},
    }
    return channels

# ============================================
# Stream Health Check
# ============================================
@api_router.get("/stream/health")
async def check_stream_health(url: str):
    """Check if a stream URL is accessible"""
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as http_client:
            resp = await http_client.head(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            return {
                "url": url,
                "status": resp.status_code,
                "ok": resp.status_code == 200,
                "content_type": resp.headers.get("content-type", "")
            }
    except Exception as e:
        return {"url": url, "status": 0, "ok": False, "error": str(e)}


# Belirli tarih için LiveScore API
@api_router.get("/livescore/date/{date_str}")
async def livescore_date(date_str: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://prod-public-api.livescore.com/v1/api/app/date/soccer/{date_str}/-3?MD=1",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            return resp.json()
    except Exception as e:
        return {"Stages": [], "error": str(e)}

# ============================================
# Stream Proxy (CORS bypass)
# ============================================
@api_router.get("/stream/proxy")
async def proxy_stream(url: str):
    """Generic stream proxy for m3u8"""
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http_client:
            from urllib.parse import urlparse, urljoin, quote
            parsed = urlparse(url)
            domain = f"{parsed.scheme}://{parsed.netloc}"
            base_url = f"{parsed.scheme}://{parsed.netloc}{'/'.join(parsed.path.split('/')[:-1])}/"
            
            response = await http_client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*",
                "Origin": domain,
                "Referer": domain + "/",
            })
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Stream fetch failed")
            
            content = response.text
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('#'):
                    if 'URI="' in line:
                        key_match = re.search(r'URI="([^"]+)"', line)
                        if key_match:
                            key_url = key_match.group(1)
                            if not key_url.startswith('http'):
                                key_url = urljoin(base_url, key_url)
                            line = re.sub(r'URI="[^"]+"', f'URI="/api/stream/ts?url={quote(key_url, safe="")}"', line)
                    new_lines.append(line)
                elif line.strip() and not line.startswith('#'):
                    seg_url = line.strip()
                    if not seg_url.startswith('http'):
                        seg_url = urljoin(base_url, seg_url)
                    new_lines.append(f'/api/stream/ts?url={quote(seg_url, safe="")}')
                else:
                    new_lines.append(line)
            
            return Response(
                content='\n'.join(new_lines),
                media_type="application/vnd.apple.mpegurl",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stream/ts")
async def proxy_ts(url: str):
    """Proxy TS segments and keys"""
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http_client:
            response = await http_client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "*/*"
            })
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Segment fetch failed")
            
            content_type = response.headers.get('content-type', 'video/mp2t')
            if 'mpegurl' in content_type.lower() or url.endswith('.m3u8'):
                content_type = 'application/vnd.apple.mpegurl'
            elif url.endswith('.ts'):
                content_type = 'video/mp2t'
            elif url.endswith('.key') or 'key' in url.lower():
                content_type = 'application/octet-stream'
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"}
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# S Sport Proxy (credentials stay in backend)
# ============================================
@api_router.get("/ssport/streams")
async def get_ssport_streams():
    """Try to get S Sport stream URLs using stored credentials"""
    if not SSPORT_EMAIL or not SSPORT_PASSWORD:
        return {"error": "S Sport credentials not configured", "streams": []}
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            # Try S Sport API login
            login_resp = await http_client.post(
                "https://api.ssport.com/api/v1/auth/login",
                json={"email": SSPORT_EMAIL, "password": SSPORT_PASSWORD},
                headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
            )
            
            if login_resp.status_code == 200:
                token_data = login_resp.json()
                token = token_data.get("token") or token_data.get("access_token") or ""
                
                if token:
                    # Get available streams
                    streams_resp = await http_client.get(
                        "https://api.ssport.com/api/v1/streams",
                        headers={"Authorization": f"Bearer {token}", "User-Agent": "Mozilla/5.0"}
                    )
                    
                    if streams_resp.status_code == 200:
                        return {"streams": streams_resp.json(), "authenticated": True}
            
            return {"error": "Login failed", "streams": [], "authenticated": False}
    except Exception as e:
        logger.error(f"S Sport error: {e}")
        return {"error": str(e), "streams": [], "authenticated": False}

# ============================================
# beIN Sports Discovery
# ============================================
@api_router.get("/bein/discover")
async def discover_bein():
    """Try to discover beIN Sports stream via data-reality"""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as http_client:
            # Try data-reality domain discovery
            resp = await http_client.get(
                "https://data-reality.com/domain.php",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            
            if resp.status_code == 200:
                base_url = resp.text.strip()
                # Try to get stream manifest
                stream_url = f"{base_url}zirve/mono.m3u8"
                
                check = await http_client.head(stream_url, headers={"User-Agent": "Mozilla/5.0"})
                
                return {
                    "base_url": base_url,
                    "stream_url": stream_url,
                    "accessible": check.status_code == 200,
                    "status_code": check.status_code
                }
            
            return {"error": "Discovery failed", "accessible": False}
    except Exception as e:
        return {"error": str(e), "accessible": False}


# ============================================
# beIN SPORTS Custom Master Manifest
# ============================================
@api_router.get("/bein/master.m3u8")
async def bein_master_manifest(video: str, audio: str):
    """Generate a custom HLS master manifest combining separate video and audio tracks"""
    manifest = f"""#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Turkish",LANGUAGE="tur",DEFAULT=YES,AUTOSELECT=YES,URI="{audio}"

#EXT-X-STREAM-INF:BANDWIDTH=4000000,AUDIO="audio"
{video}
"""
    return Response(
        content=manifest.strip(),
        media_type="application/vnd.apple.mpegurl",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        }
    )

# ============================================
# Root
# ============================================
@api_router.get("/")
async def root():
    return {"message": "banbansports UNDERGROUND HD - API Active", "version": "2.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
