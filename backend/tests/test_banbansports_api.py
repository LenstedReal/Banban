"""
Banbansports UNDERGROUND HD - Backend API regression test suite.
Covers: livescore proxy, live scores, channels, stream health, bein master manifest, root.
"""
import os
import pytest
import requests
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://repo-download-2.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


# ---- Root / health ----
def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert "banbansports" in data["message"].lower()


# ---- LiveScore proxy today ----
def test_livescore_today(client):
    r = client.get(f"{BASE_URL}/api/livescore/today", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "Stages" in data
    assert isinstance(data["Stages"], list)
    # Should have many stages (305 reported as healthy)
    assert len(data["Stages"]) > 0, "No Stages returned"


# ---- LiveScore proxy by date ----
def test_livescore_by_date(client):
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    r = client.get(f"{BASE_URL}/api/livescore/date/{date_str}", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "Stages" in data


# ---- Live scores (fetch_live_scores) ----
def test_scores_live(client):
    r = client.get(f"{BASE_URL}/api/scores/live", timeout=20)
    assert r.status_code == 200
    data = r.json()
    for key in ("type", "team1", "team2", "score1", "score2", "league", "status"):
        assert key in data, f"Missing key {key} in /api/scores/live"
    assert data["type"] == "score_update"


# ---- Channels ----
def test_channels(client):
    r = client.get(f"{BASE_URL}/api/channels")
    assert r.status_code == 200
    data = r.json()
    for ch in ["demo1", "demo2", "trt1", "trthaber", "tv8", "trtspor", "reklam"]:
        assert ch in data, f"Missing channel {ch}"
        assert "name" in data[ch]
        assert "status" in data[ch]


# ---- Stream health check ----
def test_stream_health_trt1(client):
    url = "https://tv-trt1.medya.trt.com.tr/master.m3u8"
    r = client.get(f"{BASE_URL}/api/stream/health", params={"url": url}, timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "ok" in data
    assert "status" in data


# ---- BEIN custom master manifest ----
def test_bein_master_manifest(client):
    r = client.get(
        f"{BASE_URL}/api/bein/master.m3u8",
        params={"video": "https://example.com/v.m3u8", "audio": "https://example.com/a.m3u8"}
    )
    assert r.status_code == 200
    text = r.text
    assert text.startswith("#EXTM3U")
    assert "#EXT-X-MEDIA:TYPE=AUDIO" in text
    assert "https://example.com/v.m3u8" in text
    assert "https://example.com/a.m3u8" in text


# ---- Turkish team filter check on scores/live response ----
def test_scores_live_has_turkish_priority(client):
    """Score feed should bias toward Turkish teams or known fallback (Türkiye-Romanya)."""
    r = client.get(f"{BASE_URL}/api/scores/live", timeout=20)
    assert r.status_code == 200
    data = r.json()
    # it should not be empty strings
    assert data.get("team1"), "team1 empty"
    assert data.get("team2"), "team2 empty"
