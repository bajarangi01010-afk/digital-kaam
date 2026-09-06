"""
smart_brain.py — Urban Operations Smart Brain
A single-file, production-grade autonomous service ecosystem:
* SecurityBrain — input sanitization, JWT auth, adaptive rate limiting
* S2GeospatialManager — Google S2 (level 13) indexing + neighbor matching
* EscrowPaymentGateway — escrow hold / release / 100% refund with immutable ledger
* BookingStateManager — LangGraph-inspired state machine + GPS-spoof auditor
* FastAPI application — fully async HTTP surface

Run:
pip install fastapi uvicorn pydantic pyjwt s2sphere
# optional: Google's official S2 C++ bindings (used automatically when present)
pip install s2geometry
python smart_brain.py
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import html
import logging
import math
import os
import re
import secrets
import sys
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from enum import Enum
from typing import Any, Deque, Dict, FrozenSet, List, Optional, Set, Tuple

import jwt
import uvicorn

# Google S2 Geometry: prefer the official C++ bindings (pip install s2geometry), which expose
# the `pywraps2` module; fall back to the pure-Python port `s2sphere`. Both produce identical
# 64-bit cell IDs and hex tokens, so indexes built with either backend are interchangeable.
try:  # pragma: no cover - depends on environment
    import pywraps2 as _s2  # type: ignore
    S2_BACKEND = "google-s2geometry"
except ImportError:  # pragma: no cover
    _s2 = None
    S2_BACKEND = "s2sphere"
    import s2sphere

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================

class Settings:
    """Runtime configuration sourced from the environment with hardened defaults."""
    APP_NAME: str = "Urban Operations Smart Brain"
    APP_VERSION: str = "1.0.0"
    HOST: str = os.getenv("SB_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("SB_PORT", "8000"))
    JWT_SECRET: str = os.getenv("SB_JWT_SECRET") or secrets.token_urlsafe(64)
    JWT_ALGORITHM: str = "HS256"
    JWT_TTL_MINUTES: int = int(os.getenv("SB_JWT_TTL_MINUTES", "60"))
    JWT_ISSUER: str = "smart-brain"
    JWT_AUDIENCE: str = "smart-brain-api"

    S2_LEVEL: int = 13
    MAX_MATCH_RADIUS_KM: float = 5.0
    MIN_MATCH_RADIUS_KM: float = 1.2

    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("SB_RATE_LIMIT", "120"))
    RATE_LIMIT_BURST_SECONDS: int = 2
    RATE_LIMIT_BURST_MAX: int = 25
    RATE_LIMIT_BAN_SECONDS: int = 300
    MAX_PAYLOAD_BYTES: int = 64 * 1024

    GPS_SPOOF_MAX_COMPLETION_DISTANCE_M: float = 250.0
    GPS_SPOOF_MAX_SPEED_KMH: float = 180.0
    GPS_SPOOF_MIN_ACCURACY_M: float = 150.0

    NO_SHOW_GRACE_MINUTES: int = 15
    PLATFORM_FEE_RATE: Decimal = Decimal("0.10")

    ADMIN_API_KEY: str = os.getenv("SB_ADMIN_API_KEY") or secrets.token_urlsafe(32)
    ALLOWED_ORIGINS: List[str] = [
        o.strip() for o in os.getenv("SB_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
    ]


settings = Settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("smart_brain")
security_logger = logging.getLogger("smart_brain.security")
finance_logger = logging.getLogger("smart_brain.finance")
geo_logger = logging.getLogger("smart_brain.geo")
workflow_logger = logging.getLogger("smart_brain.workflow")

if not os.getenv("SB_JWT_SECRET"):
    security_logger.warning(
        "SB_JWT_SECRET not set; generated an ephemeral secret. Tokens will not survive a restart."
    )
if not os.getenv("SB_ADMIN_API_KEY"):
    security_logger.warning("SB_ADMIN_API_KEY not set; generated ephemeral admin key: %s", settings.ADMIN_API_KEY)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =============================================================================
# DOMAIN ERRORS
# =============================================================================

class SmartBrainError(Exception):
    """Base error carrying an HTTP status code."""
    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class SecurityViolation(SmartBrainError):
    status_code = status.HTTP_400_BAD_REQUEST


class AuthenticationError(SmartBrainError):
    status_code = status.HTTP_401_UNAUTHORIZED


class AuthorizationError(SmartBrainError):
    status_code = status.HTTP_403_FORBIDDEN


class RateLimitExceeded(SmartBrainError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class NotFoundError(SmartBrainError):
    status_code = status.HTTP_404_NOT_FOUND


class InvalidTransition(SmartBrainError):
    status_code = status.HTTP_409_CONFLICT


class EscrowError(SmartBrainError):
    status_code = status.HTTP_402_PAYMENT_REQUIRED


class GpsSpoofDetected(SmartBrainError):
    status_code = 422


# =============================================================================
# 1. ANTI-HACKER SECURITY LAYER
# =============================================================================

@dataclass
class RateLimitState:
    window_hits: Deque[float] = field(default_factory=deque)
    burst_hits: Deque[float] = field(default_factory=deque)
    banned_until: float = 0.0
    strikes: int = 0


@dataclass
class ThreatEvent:
    timestamp: str
    source: str
    category: str
    detail: str


class SecurityBrain:
    """
    Defensive layer covering:
    * Input sanitization against SQL injection and XSS.
    * JWT issuance/verification (HS256 via PyJWT) with issuer/audience binding.
    * Adaptive sliding-window rate limiting with burst detection and temporary bans.
    * Threat-event log for automated security audits.
    """

    SQLI_PATTERNS: Tuple[re.Pattern[str], ...] = (
        re.compile(r"(?i)\b(union\s+(all\s+)?select|select\s+.+\s+from|insert\s+into|drop\s+(table|database)|delete\s+from|update\s+\w+\s+set|truncate\s+table|alter\s+table|exec(ute)?\s*\(|xp_cmdshell|information_schema|sleep\s*\(|benchmark\s*\(|load_file\s*\(|waitfor\s+delay)\b"),
        re.compile(r"(?i)(--|#|/\*|\*/|;)\s*(select|insert|update|delete|drop|union|or|and)\b"),
        re.compile(r"(?i)('|\")\s*(or|and)\s+('|\")?\s*[\w\d]+\s*('|\")?\s*=\s*('|\")?\s*[\w\d]+"),
        re.compile(r"(?i)\b(or|and)\s+\d+\s*=\s*\d+"),
        re.compile(r"(?i)\bcast\s*\(.+\bas\b"),
        re.compile(r"(?i)0x[0-9a-f]{8,}"),
    )

    XSS_PATTERNS: Tuple[re.Pattern[str], ...] = (
        re.compile(r"(?is)<\s*script[^>]*>.*?<\s*/\s*script\s*>"),
        re.compile(r"(?i)<\s*/?\s*(script|iframe|object|embed|svg|img|link|meta|style|base|form|input|body|video|audio|source|math|frame|frameset|applet)\b"),
        re.compile(r"(?i)\bon(load|error|click|mouse\w+|focus|blur|key\w+|submit|change|input|drag\w*|drop|animation\w*|transition\w*|toggle|wheel|scroll|abort|begin|end|pointer\w+|touch\w+)\s*="),
        re.compile(r"(?i)javascript\s*:"),
        re.compile(r"(?i)vbscript\s*:"),
        re.compile(r"(?i)data\s*:\s*text/html"),
        re.compile(r"(?i)expression\s*\("),
        re.compile(r"(?i)(document\.(cookie|location|write|domain)|window\.(location|open)|eval\s*\(|settimeout\s*\(|setinterval\s*\(|fromcharcode|innerhtml|outerhtml|srcdoc)"),
        re.compile(r"&#x?[0-9a-fA-F]{2,};.*&#x?[0-9a-fA-F]{2,};"),
    )

    PATH_TRAVERSAL: re.Pattern[str] = re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.%2e/|%c0%ae)", re.IGNORECASE)
    CONTROL_CHARS: re.Pattern[str] = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
    IDENTIFIER: re.Pattern[str] = re.compile(r"^[A-Za-z0-9_\-:.]{1,128}$")
    SCRAPER_UA: re.Pattern[str] = re.compile(
        r"(?i)(python-requests|scrapy|curl/|wget/|httpclient|libwww|go-http-client|java/|okhttp|masscan|nikto|sqlmap|nmap|zgrab|dirbuster|gobuster|nuclei)"
    )

    def __init__(self) -> None:
        self._rate_states: Dict[str, RateLimitState] = {}
        self._rate_lock = asyncio.Lock()
        self._threat_log: Deque[ThreatEvent] = deque(maxlen=5000)
        self._revoked_jti: Set[str] = set()
        self._token_counter: int = 0

    # ---------------------------------------------------------------- Sanitization
    def _record_threat(self, source: str, category: str, detail: str) -> None:
        event = ThreatEvent(timestamp=utc_now().isoformat(), source=source, category=category, detail=detail[:256])
        self._threat_log.append(event)
        security_logger.warning("THREAT [%s] from %s: %s", category, source, detail[:200])

    def sanitize_text(self, value: str, field_name: str = "input", max_length: int = 512, source: str = "unknown") -> str:
        """Reject SQLi/XSS/path-traversal payloads and return an HTML-escaped, trimmed string."""
        try:
            if not isinstance(value, str):
                raise SecurityViolation(f"{field_name} must be a string")
            if len(value) > max_length:
                self._record_threat(source, "OVERSIZED_INPUT", f"{field_name} length {len(value)} > {max_length}")
                raise SecurityViolation(f"{field_name} exceeds maximum length of {max_length}")
            if self.CONTROL_CHARS.search(value):
                self._record_threat(source, "CONTROL_CHARS", f"{field_name} contained control characters")
                raise SecurityViolation(f"{field_name} contains forbidden control characters")
            for pattern in self.SQLI_PATTERNS:
                if pattern.search(value):
                    self._record_threat(source, "SQL_INJECTION", f"{field_name}: {value}")
                    raise SecurityViolation(f"{field_name} rejected by SQL injection filter")
            for pattern in self.XSS_PATTERNS:
                if pattern.search(value):
                    self._record_threat(source, "XSS", f"{field_name}: {value}")
                    raise SecurityViolation(f"{field_name} rejected by XSS filter")
            if self.PATH_TRAVERSAL.search(value):
                self._record_threat(source, "PATH_TRAVERSAL", f"{field_name}: {value}")
                raise SecurityViolation(f"{field_name} rejected by path traversal filter")
            return html.escape(value.strip(), quote=True)
        except SecurityViolation:
            raise
        except Exception as exc:  # pragma: no cover - defensive
            security_logger.exception("Unexpected sanitization failure on %s: %s", field_name, exc)
            raise SecurityViolation(f"{field_name} failed sanitization") from exc

    def sanitize_identifier(self, value: str, field_name: str = "id", source: str = "unknown") -> str:
        if not isinstance(value, str) or not self.IDENTIFIER.match(value):
            self._record_threat(source, "MALFORMED_IDENTIFIER", f"{field_name}: {str(value)[:64]}")
            raise SecurityViolation(f"{field_name} is not a valid identifier")
        return value

    # ---------------------------------------------------------------- Tokens
    def issue_token(self, subject: str, role: str, extra_claims: Optional[Dict[str, Any]] = None) -> Tuple[str, datetime]:
        try:
            now = utc_now()
            expires = now + timedelta(minutes=settings.JWT_TTL_MINUTES)
            self._token_counter += 1
            jti = hashlib.sha256(f"{subject}:{now.timestamp()}:{self._token_counter}:{secrets.token_hex(8)}".encode()).hexdigest()[:32]
            payload: Dict[str, Any] = {
                "sub": subject,
                "role": role,
                "iss": settings.JWT_ISSUER,
                "aud": settings.JWT_AUDIENCE,
                "iat": int(now.timestamp()),
                "nbf": int(now.timestamp()) - 5,
                "exp": int(expires.timestamp()),
                "jti": jti,
            }
            if extra_claims:
                for key, val in extra_claims.items():
                    if key not in payload:
                        payload[key] = val
            token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
            security_logger.info("Issued token for sub=%s role=%s jti=%s", subject, role, jti)
            return token, expires
        except Exception as exc:
            security_logger.exception("Token issuance failed for %s: %s", subject, exc)
            raise AuthenticationError("Unable to issue token", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    def verify_token(self, token: str, source: str = "unknown") -> Dict[str, Any]:
        try:
            if not token or len(token) > 4096 or token.count(".") != 2:
                self._record_threat(source, "MALFORMED_TOKEN", "structure invalid")
                raise AuthenticationError("Malformed token")
            claims: Dict[str, Any] = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                issuer=settings.JWT_ISSUER,
                audience=settings.JWT_AUDIENCE,
                options={"require": ["exp", "iat", "sub", "jti", "role"]},
                leeway=5,
            )
            if claims.get("jti") in self._revoked_jti:
                self._record_threat(source, "REVOKED_TOKEN_REPLAY", f"jti={claims.get('jti')}")
                raise AuthenticationError("Token has been revoked")
            return claims
        except AuthenticationError:
            raise
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token expired")
        except jwt.InvalidTokenError as exc:
            self._record_threat(source, "INVALID_TOKEN", str(exc))
            raise AuthenticationError("Invalid token")
        except Exception as exc:
            security_logger.exception("Token verification crashed: %s", exc)
            raise AuthenticationError("Token verification failed")

    def revoke_token(self, jti: str) -> None:
        self._revoked_jti.add(jti)
        security_logger.info("Revoked token jti=%s", jti)

    def verify_admin_key(self, presented: Optional[str], source: str = "unknown") -> None:
        if not presented or not hmac.compare_digest(presented.encode(), settings.ADMIN_API_KEY.encode()):
            self._record_threat(source, "ADMIN_KEY_FAILURE", "invalid admin key presented")
            raise AuthorizationError("Admin credentials rejected")

    @staticmethod
    def secure_hash(value: str) -> str:
        return hmac.new(settings.JWT_SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()

    # ---------------------------------------------------------------- Rate limiting
    async def enforce_rate_limit(self, client_key: str, user_agent: str = "") -> None:
        """Sliding-window limiter with burst detection, scraper heuristics, and escalating bans."""
        now = time.monotonic()
        async with self._rate_lock:
            try:
                state = self._rate_states.setdefault(client_key, RateLimitState())
                if state.banned_until > now:
                    self._record_threat(client_key, "BANNED_CLIENT_RETRY", f"remaining={int(state.banned_until - now)}s")
                    raise RateLimitExceeded(f"Client temporarily banned. Retry in {int(state.banned_until - now)}s")
                window_start = now - settings.RATE_LIMIT_WINDOW_SECONDS
                while state.window_hits and state.window_hits[0] < window_start:
                    state.window_hits.popleft()
                burst_start = now - settings.RATE_LIMIT_BURST_SECONDS
                while state.burst_hits and state.burst_hits[0] < burst_start:
                    state.burst_hits.popleft()
                state.window_hits.append(now)
                state.burst_hits.append(now)
                scraper = bool(user_agent and self.SCRAPER_UA.search(user_agent))
                effective_max = settings.RATE_LIMIT_MAX_REQUESTS // 4 if scraper else settings.RATE_LIMIT_MAX_REQUESTS
                effective_burst = settings.RATE_LIMIT_BURST_MAX // 2 if scraper else settings.RATE_LIMIT_BURST_MAX
                if len(state.burst_hits) > effective_burst:
                    state.strikes += 1
                    penalty = settings.RATE_LIMIT_BAN_SECONDS * min(state.strikes, 6)
                    state.banned_until = now + penalty
                    self._record_threat(client_key, "BOT_BURST", f"{len(state.burst_hits)} hits in {settings.RATE_LIMIT_BURST_SECONDS}s; banned {penalty}s")
                    raise RateLimitExceeded("Burst traffic detected. Client banned temporarily.")
                if len(state.window_hits) > effective_max:
                    state.strikes += 1
                    if state.strikes >= 3:
                        state.banned_until = now + settings.RATE_LIMIT_BAN_SECONDS
                        self._record_threat(client_key, "RATE_LIMIT_BAN", f"strikes={state.strikes}")
                    else:
                        self._record_threat(client_key, "RATE_LIMIT", f"{len(state.window_hits)} hits/{settings.RATE_LIMIT_WINDOW_SECONDS}s")
                    raise RateLimitExceeded("Rate limit exceeded")
                if len(self._rate_states) > 50_000:
                    stale = [k for k, s in self._rate_states.items() if not s.window_hits and s.banned_until < now]
                    for k in stale[:10_000]:
                        self._rate_states.pop(k, None)
            except RateLimitExceeded:
                raise
            except Exception as exc:
                security_logger.exception("Rate limiter fault for %s: %s", client_key, exc)

    # ---------------------------------------------------------------- Audit
    def threat_report(self, limit: int = 200) -> Dict[str, Any]:
        events = list(self._threat_log)[-limit:]
        by_category: Dict[str, int] = {}
        by_source: Dict[str, int] = {}
        for e in self._threat_log:
            by_category[e.category] = by_category.get(e.category, 0) + 1
            by_source[e.source] = by_source.get(e.source, 0) + 1
        now = time.monotonic()
        banned = [k for k, s in self._rate_states.items() if s.banned_until > now]
        return {
            "total_events": len(self._threat_log),
            "by_category": by_category,
            "top_sources": sorted(by_source.items(), key=lambda kv: kv[1], reverse=True)[:20],
            "currently_banned": banned,
            "revoked_tokens": len(self._revoked_jti),
            "recent_events": [e.__dict__ for e in events],
        }


# =============================================================================
# 2. GEOSPATIAL ENGINE (Google S2, Level 13)
# =============================================================================

EARTH_RADIUS_KM: float = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


@dataclass
class WorkerProfile:
    worker_id: str
    name: str
    skill: str
    lat: float
    lng: float
    cell_token: str
    rating: float = 5.0
    available: bool = True
    last_seen: datetime = field(default_factory=utc_now)


class S2GeospatialManager:
    """
    Indexes workers by S2 cell at level 13 (~1.27 km average edge) and resolves
    nearby candidates by expanding concentric neighbor rings until the requested
    radius (1.2 km – 5 km) is covered, then filters by true great-circle distance.
    """

    LEVEL_EDGE_KM: Dict[int, float] = {11: 5.07, 12: 2.54, 13: 1.27, 14: 0.63, 15: 0.32}

    def __init__(self, level: int = settings.S2_LEVEL) -> None:
        if not 0 <= level <= 30:
            raise ValueError("S2 level must be between 0 and 30")
        self.level = level
        self._workers: Dict[str, WorkerProfile] = {}
        self._cell_index: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()

    # ---------------------------------------------------------------- Cells
    @staticmethod
    def validate_coordinates(lat: float, lng: float) -> None:
        if not (math.isfinite(lat) and math.isfinite(lng)):
            raise SecurityViolation("Coordinates must be finite numbers")
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
            raise SecurityViolation("Coordinates out of range")
        if abs(lat) < 1e-9 and abs(lng) < 1e-9:
            raise SecurityViolation("Null Island coordinates rejected as spoofing indicator")

    def _s2_cell_from_latlng(self, lat: float, lng: float) -> Any:
        if _s2 is not None:
            latlng = _s2.S2LatLng.FromDegrees(lat, lng)
            return _s2.S2CellId(latlng).parent(self.level)
        latlng = s2sphere.LatLng.from_degrees(lat, lng)
        return s2sphere.CellId.from_lat_lng(latlng).parent(self.level)

    @staticmethod
    def _s2_neighbors(cell: Any, level: int) -> List[Any]:
        if _s2 is not None:
            return list(cell.GetAllNeighbors(level))
        return list(cell.get_all_neighbors(level))

    @staticmethod
    def _s2_token(cell: Any) -> str:
        return cell.ToToken() if _s2 is not None else cell.to_token()

    def cell_id(self, lat: float, lng: float) -> Any:
        self.validate_coordinates(lat, lng)
        try:
            return self._s2_cell_from_latlng(lat, lng)
        except Exception as exc:
            geo_logger.exception("S2 cell computation failed for (%s, %s): %s", lat, lng, exc)
            raise SmartBrainError("Geospatial indexing failure", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    def cell_token(self, lat: float, lng: float) -> str:
        return self._s2_token(self.cell_id(lat, lng))

    def neighbor_tokens(self, lat: float, lng: float, rings: int = 1) -> List[str]:
        center = self.cell_id(lat, lng)
        visited: Dict[int, Any] = {center.id(): center}
        frontier: List[Any] = [center]
        try:
            for _ in range(max(0, rings)):
                next_frontier: List[Any] = []
                for cell in frontier:
                    for nb in self._s2_neighbors(cell, self.level):
                        if nb.id() not in visited:
                            visited[nb.id()] = nb
                            next_frontier.append(nb)
                frontier = next_frontier
        except Exception as exc:
            geo_logger.exception("Neighbor expansion failed: %s", exc)
            raise SmartBrainError("Neighbor expansion failure", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc
        return [self._s2_token(c) for c in visited.values()]

    def rings_for_radius(self, radius_km: float) -> int:
        edge = self.LEVEL_EDGE_KM.get(self.level, 1.27)
        rings = math.ceil(radius_km / edge)
        return max(1, min(rings, 6))

    # ---------------------------------------------------------------- Worker index
    async def upsert_worker(self, worker_id: str, name: str, skill: str, lat: float, lng: float, rating: float = 5.0) -> WorkerProfile:
        token = self.cell_token(lat, lng)
        async with self._lock:
            existing = self._workers.get(worker_id)
            if existing and existing.cell_token != token:
                self._cell_index.get(existing.cell_token, set()).discard(worker_id)
            profile = WorkerProfile(
                worker_id=worker_id, name=name, skill=skill, lat=lat, lng=lng,
                cell_token=token, rating=rating, available=existing.available if existing else True,
            )
            self._workers[worker_id] = profile
            self._cell_index.setdefault(token, set()).add(worker_id)
            geo_logger.info("Indexed worker %s in cell %s (skill=%s)", worker_id, token, skill)
            return profile

    async def set_availability(self, worker_id: str, available: bool) -> None:
        async with self._lock:
            worker = self._workers.get(worker_id)
            if worker is None:
                raise NotFoundError(f"Worker {worker_id} not found")
            worker.available = available
            worker.last_seen = utc_now()

    async def get_worker(self, worker_id: str) -> WorkerProfile:
        async with self._lock:
            worker = self._workers.get(worker_id)
            if worker is None:
                raise NotFoundError(f"Worker {worker_id} not found")
            return worker

    async def find_nearby_workers(
        self, lat: float, lng: float, skill: str, radius_km: float, limit: int = 10
    ) -> List[Tuple[WorkerProfile, float]]:
        radius_km = max(settings.MIN_MATCH_RADIUS_KM, min(radius_km, settings.MAX_MATCH_RADIUS_KM))
        rings = self.rings_for_radius(radius_km)
        tokens = self.neighbor_tokens(lat, lng, rings=rings)
        candidates: List[Tuple[WorkerProfile, float]] = []
        async with self._lock:
            for token in tokens:
                for worker_id in self._cell_index.get(token, ()):
                    worker = self._workers.get(worker_id)
                    if worker is None or not worker.available or worker.skill.lower() != skill.lower():
                        continue
                    distance = haversine_km(lat, lng, worker.lat, worker.lng)
                    if distance <= radius_km:
                        candidates.append((worker, distance))
            candidates.sort(key=lambda pair: (pair[1], -pair[0].rating))
            geo_logger.info(
                "Matching scan: %d cells, %d candidates within %.2f km for skill=%s", len(tokens), len(candidates), radius_km, skill
            )
            return candidates[:limit]

    def stats(self) -> Dict[str, Any]:
        return {
            "level": self.level,
            "workers_indexed": len(self._workers),
            "occupied_cells": sum(1 for v in self._cell_index.values() if v),
            "available_workers": sum(1 for w in self._workers.values() if w.available),
        }


# =============================================================================
# 3. ESCROW FINANCIAL ENGINE
# =============================================================================

class EscrowStatus(str, Enum):
    HELD = "HELD"
    RELEASED = "RELEASED"
    REFUNDED = "REFUNDED"


@dataclass
class EscrowRecord:
    booking_id: str
    customer_id: str
    amount: Decimal
    status: EscrowStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
    worker_id: Optional[str] = None
    platform_fee: Decimal = Decimal("0.00")
    worker_payout: Decimal = Decimal("0.00")
    refunded_amount: Decimal = Decimal("0.00")


@dataclass
class LedgerEntry:
    seq: int
    timestamp: str
    booking_id: str
    event: str
    amount: str
    balance_after: str
    prev_hash: str
    entry_hash: str


class EscrowPaymentGateway:
    """
    Escrow engine with:
    * Idempotent, lock-guarded deposits, releases, and refunds.
    * Decimal-exact money math (2dp, half-up).
    * Hash-chained append-only ledger for tamper evidence.
    """

    CENTS = Decimal("0.01")

    def __init__(self) -> None:
        self._escrows: Dict[str, EscrowRecord] = {}
        self._ledger: List[LedgerEntry] = []
        self._pool_balance: Decimal = Decimal("0.00")
        self._lock = asyncio.Lock()

    @classmethod
    def to_money(cls, value: Any) -> Decimal:
        try:
            amount = Decimal(str(value)).quantize(cls.CENTS, rounding=ROUND_HALF_UP)
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise EscrowError("Invalid monetary amount") from exc
        if not amount.is_finite():
            raise EscrowError("Non-finite monetary amount")
        return amount

    def _append_ledger(self, booking_id: str, event: str, amount: Decimal) -> None:
        prev_hash = self._ledger[-1].entry_hash if self._ledger else "GENESIS"
        seq = len(self._ledger) + 1
        timestamp = utc_now().isoformat()
        raw = f"{seq}|{timestamp}|{booking_id}|{event}|{amount}|{self._pool_balance}|{prev_hash}"
        entry_hash = hashlib.sha256(raw.encode()).hexdigest()
        self._ledger.append(
            LedgerEntry(seq, timestamp, booking_id, event, str(amount), str(self._pool_balance), prev_hash, entry_hash)
        )
        finance_logger.info("LEDGER #%d %s booking=%s amount=%s pool=%s", seq, event, booking_id, amount, self._pool_balance)

    async def hold_funds_in_escrow(self, booking_id: str, amount: Any, customer_id: str) -> EscrowRecord:
        money = self.to_money(amount)
        if money <= Decimal("0.00"):
            raise EscrowError("Escrow amount must be positive")
        if money > Decimal("100000.00"):
            raise EscrowError("Escrow amount exceeds single-transaction ceiling")
        async with self._lock:
            try:
                existing = self._escrows.get(booking_id)
                if existing is not None:
                    if existing.status == EscrowStatus.HELD and existing.amount == money:
                        finance_logger.info("Idempotent escrow hold for booking %s", booking_id)
                        return existing
                    raise EscrowError(f"Escrow already exists for booking {booking_id} with status {existing.status.value}")
                record = EscrowRecord(
                    booking_id=booking_id, customer_id=customer_id, amount=money,
                    status=EscrowStatus.HELD, created_at=utc_now(),
                )
                self._escrows[booking_id] = record
                self._pool_balance += money
                self._append_ledger(booking_id, "HOLD", money)
                return record
            except EscrowError:
                raise
            except Exception as exc:
                finance_logger.exception("Escrow hold failed for %s: %s", booking_id, exc)
                raise EscrowError("Escrow hold failed", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    async def release_funds_to_worker(self, booking_id: str, worker_id: str) -> EscrowRecord:
        async with self._lock:
            try:
                record = self._escrows.get(booking_id)
                if record is None:
                    raise NotFoundError(f"No escrow for booking {booking_id}")
                if record.status == EscrowStatus.RELEASED and record.worker_id == worker_id:
                    finance_logger.info("Idempotent release for booking %s", booking_id)
                    return record
                if record.status != EscrowStatus.HELD:
                    raise EscrowError(f"Cannot release escrow in status {record.status.value}")
                fee = (record.amount * settings.PLATFORM_FEE_RATE).quantize(self.CENTS, rounding=ROUND_HALF_UP)
                payout = record.amount - fee
                if payout < Decimal("0.00"):
                    raise EscrowError("Computed payout is negative")
                record.platform_fee = fee
                record.worker_payout = payout
                record.worker_id = worker_id
                record.status = EscrowStatus.RELEASED
                record.resolved_at = utc_now()
                self._pool_balance -= record.amount
                self._append_ledger(booking_id, f"RELEASE->{worker_id}", payout)
                self._append_ledger(booking_id, "PLATFORM_FEE", fee)
                return record
            except (EscrowError, NotFoundError):
                raise
            except Exception as exc:
                finance_logger.exception("Escrow release failed for %s: %s", booking_id, exc)
                raise EscrowError("Escrow release failed", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    async def trigger_100_percent_customer_refund(self, booking_id: str, reason: str) -> EscrowRecord:
        """Consumer-safety guarantee: returns the full held amount with zero fee deducted."""
        async with self._lock:
            try:
                record = self._escrows.get(booking_id)
                if record is None:
                    raise NotFoundError(f"No escrow for booking {booking_id}")
                if record.status == EscrowStatus.REFUNDED:
                    finance_logger.info("Idempotent refund for booking %s", booking_id)
                    return record
                if record.status != EscrowStatus.HELD:
                    raise EscrowError(f"Cannot refund escrow in status {record.status.value}")
                record.refunded_amount = record.amount
                record.platform_fee = Decimal("0.00")
                record.worker_payout = Decimal("0.00")
                record.status = EscrowStatus.REFUNDED
                record.resolved_at = utc_now()
                self._pool_balance -= record.amount
                self._append_ledger(booking_id, f"REFUND_100%:{reason[:40]}", record.amount)
                finance_logger.warning("100%% refund of %s issued to customer %s for booking %s (%s)",
                                       record.amount, record.customer_id, booking_id, reason)
                return record
            except (EscrowError, NotFoundError):
                raise
            except Exception as exc:
                finance_logger.exception("Refund failed for %s: %s", booking_id, exc)
                raise EscrowError("Refund failed", status.HTTP_500_INTERNAL_SERVER_ERROR) from exc

    async def get_record(self, booking_id: str) -> EscrowRecord:
        async with self._lock:
            record = self._escrows.get(booking_id)
            if record is None:
                raise NotFoundError(f"No escrow for booking {booking_id}")
            return record

    def verify_ledger_integrity(self) -> Tuple[bool, Optional[int]]:
        prev = "GENESIS"
        for entry in self._ledger:
            raw = f"{entry.seq}|{entry.timestamp}|{entry.booking_id}|{entry.event}|{entry.amount}|{entry.balance_after}|{prev}"
            if entry.prev_hash != prev or hashlib.sha256(raw.encode()).hexdigest() != entry.entry_hash:
                finance_logger.critical("LEDGER TAMPERING DETECTED at seq %d", entry.seq)
                return False, entry.seq
            prev = entry.entry_hash
        return True, None

    def stats(self) -> Dict[str, Any]:
        ok, broken_seq = self.verify_ledger_integrity()
        return {
            "pool_balance": str(self._pool_balance),
            "escrows": len(self._escrows),
            "held": sum(1 for r in self._escrows.values() if r.status == EscrowStatus.HELD),
            "released": sum(1 for r in self._escrows.values() if r.status == EscrowStatus.RELEASED),
            "refunded": sum(1 for r in self._escrows.values() if r.status == EscrowStatus.REFUNDED),
            "ledger_entries": len(self._ledger),
            "ledger_intact": ok,
            "ledger_break_seq": broken_seq,
        }


# =============================================================================
# 4. STATE MACHINE CORE WORKFLOW
# =============================================================================

class BookingState(str, Enum):
    INITIATED = "INITIATED"
    SECURED_ESCROW = "SECURED_ESCROW"
    MATCHED = "MATCHED"
    COMPLETED = "COMPLETED"
    NO_SHOW_REFUNDED = "NO_SHOW_REFUNDED"
    CANCELLED_REFUNDED = "CANCELLED_REFUNDED"
    FLAGGED_SPOOF = "FLAGGED_SPOOF"


@dataclass
class GpsPing:
    lat: float
    lng: float
    accuracy_m: float
    timestamp: datetime


@dataclass
class Booking:
    booking_id: str
    customer_id: str
    skill: str
    lat: float
    lng: float
    cell_token: str
    amount: Decimal
    description: str
    state: BookingState
    created_at: datetime
    updated_at: datetime
    worker_id: Optional[str] = None
    matched_at: Optional[datetime] = None
    scheduled_for: Optional[datetime] = None
    history: List[Dict[str, str]] = field(default_factory=list)
    worker_pings: List[GpsPing] = field(default_factory=list)
    audit_result: Optional[Dict[str, Any]] = None


class BookingStateManager:
    """
    Graph-style state machine. Each node is a BookingState; edges are the allowed
    transitions. Every transition is atomic under an asyncio lock, journaled to the
    booking's history, and wired to side effects in the escrow gateway.
    """

    TRANSITIONS: Dict[BookingState, FrozenSet[BookingState]] = {
        BookingState.INITIATED: frozenset({BookingState.SECURED_ESCROW, BookingState.CANCELLED_REFUNDED}),
        BookingState.SECURED_ESCROW: frozenset({BookingState.MATCHED, BookingState.CANCELLED_REFUNDED}),
        BookingState.MATCHED: frozenset({BookingState.COMPLETED, BookingState.NO_SHOW_REFUNDED, BookingState.FLAGGED_SPOOF}),
        BookingState.FLAGGED_SPOOF: frozenset({BookingState.NO_SHOW_REFUNDED, BookingState.COMPLETED}),
        BookingState.COMPLETED: frozenset(),
        BookingState.NO_SHOW_REFUNDED: frozenset(),
        BookingState.CANCELLED_REFUNDED: frozenset(),
    }

    def __init__(self, geo: S2GeospatialManager, escrow: EscrowPaymentGateway, security: SecurityBrain) -> None:
        self.geo = geo
        self.escrow = escrow
        self.security = security
        self._bookings: Dict[str, Booking] = {}
        self._lock = asyncio.Lock()

    # ---------------------------------------------------------------- Helpers
    def _transition(self, booking: Booking, target: BookingState, note: str) -> None:
        allowed = self.TRANSITIONS.get(booking.state, frozenset())
        if target not in allowed:
            raise InvalidTransition(f"Illegal transition {booking.state.value} -> {target.value}")
        previous = booking.state
        booking.state = target
        booking.updated_at = utc_now()
        booking.history.append({"from": previous.value, "to": target.value, "at": booking.updated_at.isoformat(), "note": note})
        workflow_logger.info("Booking %s: %s -> %s (%s)", booking.booking_id, previous.value, target.value, note)

    async def get_booking(self, booking_id: str) -> Booking:
        async with self._lock:
            booking = self._bookings.get(booking_id)
            if booking is None:
                raise NotFoundError(f"Booking {booking_id} not found")
            return booking

    # ---------------------------------------------------------------- Graph nodes
    async def create_booking(
        self, customer_id: str, skill: str, lat: float, lng: float, amount: Any, description: str,
        scheduled_for: Optional[datetime]
    ) -> Booking:
        money = self.escrow.to_money(amount)
        token = self.geo.cell_token(lat, lng)
        booking_id = f"bk_{uuid.uuid4().hex[:16]}"
        now = utc_now()
        booking = Booking(
            booking_id=booking_id, customer_id=customer_id, skill=skill, lat=lat, lng=lng, cell_token=token,
            amount=money, description=description, state=BookingState.INITIATED, created_at=now, updated_at=now,
            scheduled_for=scheduled_for or now,
        )
        booking.history.append({"from": "-", "to": BookingState.INITIATED.value, "at": now.isoformat(), "note": "created"})
        async with self._lock:
            self._bookings[booking_id] = booking
        try:
            await self.escrow.hold_funds_in_escrow(booking_id, money, customer_id)
            async with self._lock:
                self._transition(booking, BookingState.SECURED_ESCROW, f"escrow held {money}")
        except Exception as exc:
            workflow_logger.exception("Escrow hold failed during booking creation %s: %s", booking_id, exc)
            async with self._lock:
                self._transition(booking, BookingState.CANCELLED_REFUNDED, "escrow hold failed")
            raise
        return booking

    async def match_worker(self, booking_id: str, radius_km: float, worker_id: Optional[str] = None) -> Booking:
        booking = await self.get_booking(booking_id)
        if booking.state != BookingState.SECURED_ESCROW:
            raise InvalidTransition(f"Booking in state {booking.state.value} cannot be matched")
        if worker_id:
            worker = await self.geo.get_worker(worker_id)
            distance = haversine_km(booking.lat, booking.lng, worker.lat, worker.lng)
            if not worker.available or worker.skill.lower() != booking.skill.lower():
                raise InvalidTransition("Requested worker unavailable or skill mismatch")
            if distance > settings.MAX_MATCH_RADIUS_KM:
                raise InvalidTransition(f"Requested worker is {distance:.2f} km away, beyond the 5 km ceiling")
            chosen, chosen_distance = worker, distance
        else:
            candidates = await self.geo.find_nearby_workers(booking.lat, booking.lng, booking.skill, radius_km)
            if not candidates:
                raise NotFoundError(f"No available '{booking.skill}' workers within {radius_km:.1f} km")
            chosen, chosen_distance = candidates[0]
        await self.geo.set_availability(chosen.worker_id, False)
        async with self._lock:
            booking.worker_id = chosen.worker_id
            booking.matched_at = utc_now()
            self._transition(booking, BookingState.MATCHED, f"matched {chosen.worker_id} at {chosen_distance:.2f} km")
        return booking

    async def record_worker_ping(self, booking_id: str, worker_id: str, lat: float, lng: float, accuracy_m: float) -> Booking:
        self.geo.validate_coordinates(lat, lng)
        booking = await self.get_booking(booking_id)
        if booking.state not in (BookingState.MATCHED, BookingState.FLAGGED_SPOOF):
            raise InvalidTransition("Pings are only accepted for matched bookings")
        if booking.worker_id != worker_id:
            self.security._record_threat(worker_id, "PING_IDENTITY_MISMATCH", f"booking={booking_id}")
            raise AuthorizationError("Worker is not assigned to this booking")
        async with self._lock:
            booking.worker_pings.append(GpsPing(lat=lat, lng=lng, accuracy_m=accuracy_m, timestamp=utc_now()))
            if len(booking.worker_pings) > 500:
                booking.worker_pings = booking.worker_pings[-500:]
        return booking

    # ---------------------------------------------------------------- Auditor
    def audit_gps_integrity(self, booking: Booking, completion_lat: float, completion_lng: float, completion_accuracy_m: float) -> Dict[str, Any]:
        """
        Cross-checks the worker's completion coordinates against the booking site and
        the worker's own trajectory. Flags: distance mismatch, impossible velocity,
        suspiciously perfect accuracy, teleport jumps, and out-of-range values.
        """
        flags: List[str] = []
        try:
            self.geo.validate_coordinates(completion_lat, completion_lng)
        except SecurityViolation as exc:
            flags.append(f"INVALID_COMPLETION_COORDS:{exc.message}")
            return {"passed": False, "flags": flags, "distance_to_site_m": None, "max_speed_kmh": None}

        distance_m = haversine_km(booking.lat, booking.lng, completion_lat, completion_lng) * 1000.0
        if distance_m > settings.GPS_SPOOF_MAX_COMPLETION_DISTANCE_M:
            flags.append(f"COMPLETION_FAR_FROM_SITE:{distance_m:.0f}m")

        if completion_accuracy_m <= 0.0 or completion_accuracy_m > settings.GPS_SPOOF_MIN_ACCURACY_M:
            flags.append(f"IMPLAUSIBLE_ACCURACY:{completion_accuracy_m:.1f}m")

        max_speed = 0.0
        pings = list(booking.worker_pings) + [GpsPing(completion_lat, completion_lng, completion_accuracy_m, utc_now())]
        for prev, curr in zip(pings, pings[1:]):
            dt_hours = max((curr.timestamp - prev.timestamp).total_seconds(), 1.0) / 3600.0
            dist_km = haversine_km(prev.lat, prev.lng, curr.lat, curr.lng)
            speed = dist_km / dt_hours
            max_speed = max(max_speed, speed)
            if speed > settings.GPS_SPOOF_MAX_SPEED_KMH:
                flags.append(f"IMPOSSIBLE_VELOCITY:{speed:.0f}kmh")
                break

        if len(pings) >= 3:
            same_cell = {self.geo.cell_token(p.lat, p.lng) for p in pings}
            if len(same_cell) == 1 and all(abs(p.lat - pings[0].lat) < 1e-7 and abs(p.lng - pings[0].lng) < 1e-7 for p in pings):
                flags.append("FROZEN_COORDINATES")

        if booking.worker_id:
            try:
                worker_cell = self.geo.cell_token(completion_lat, completion_lng)
                site_neighbors = set(self.geo.neighbor_tokens(booking.lat, booking.lng, rings=1))
                if worker_cell not in site_neighbors:
                    flags.append("COMPLETION_OUTSIDE_SITE_NEIGHBORHOOD")
            except SmartBrainError as exc:
                flags.append(f"CELL_CHECK_FAILED:{exc.message}")

        passed = not flags
        result = {
            "passed": passed,
            "flags": flags,
            "distance_to_site_m": round(distance_m, 1),
            "max_speed_kmh": round(max_speed, 1),
            "ping_count": len(booking.worker_pings),
            "audited_at": utc_now().isoformat(),
        }
        if not passed:
            self.security._record_threat(booking.worker_id or "unknown", "GPS_SPOOF_SUSPECT", f"booking={booking.booking_id} flags={flags}")
        return result

    async def complete_booking(self, booking_id: str, worker_id: str, lat: float, lng: float, accuracy_m: float) -> Booking:
        booking = await self.get_booking(booking_id)
        if booking.state not in (BookingState.MATCHED, BookingState.FLAGGED_SPOOF):
            raise InvalidTransition(f"Booking in state {booking.state.value} cannot be completed")
        if booking.worker_id != worker_id:
            self.security._record_threat(worker_id, "COMPLETION_IDENTITY_MISMATCH", f"booking={booking_id}")
            raise AuthorizationError("Worker is not assigned to this booking")

        audit = self.audit_gps_integrity(booking, lat, lng, accuracy_m)
        async with self._lock:
            booking.audit_result = audit
            if not audit["passed"]:
                if booking.state == BookingState.MATCHED:
                    self._transition(booking, BookingState.FLAGGED_SPOOF, f"auditor flags: {audit['flags']}")
                raise GpsSpoofDetected(f"GPS integrity audit failed: {', '.join(audit['flags'])}")

        await self.escrow.release_funds_to_worker(booking_id, worker_id)
        await self.geo.set_availability(worker_id, True)
        async with self._lock:
            self._transition(booking, BookingState.COMPLETED, "audit passed; escrow released")
        return booking

    async def report_no_show(self, booking_id: str, reporter_id: str, force: bool = False) -> Booking:
        booking = await self.get_booking(booking_id)
        if booking.state not in (BookingState.MATCHED, BookingState.FLAGGED_SPOOF):
            raise InvalidTransition(f"Booking in state {booking.state.value} cannot be marked no-show")
        if booking.customer_id != reporter_id and not force:
            raise AuthorizationError("Only the booking customer can report a no-show")

        scheduled = booking.scheduled_for or booking.created_at
        grace_deadline = scheduled + timedelta(minutes=settings.NO_SHOW_GRACE_MINUTES)
        if utc_now() < grace_deadline and not force:
            raise InvalidTransition(f"No-show can be reported after {grace_deadline.isoformat()}")

        await self.escrow.trigger_100_percent_customer_refund(booking_id, "WORKER_NO_SHOW")
        if booking.worker_id:
            try:
                await self.geo.set_availability(booking.worker_id, True)
            except NotFoundError:
                workflow_logger.warning("Worker %s vanished before no-show release", booking.worker_id)
        async with self._lock:
            self._transition(booking, BookingState.NO_SHOW_REFUNDED, "worker no-show; 100% refund issued")
        return booking

    async def cancel_booking(self, booking_id: str, customer_id: str) -> Booking:
        booking = await self.get_booking(booking_id)
        if booking.customer_id != customer_id:
            raise AuthorizationError("Only the booking customer can cancel")
        if booking.state not in (BookingState.INITIATED, BookingState.SECURED_ESCROW):
            raise InvalidTransition(f"Booking in state {booking.state.value} cannot be cancelled")

        if booking.state == BookingState.SECURED_ESCROW:
            await self.escrow.trigger_100_percent_customer_refund(booking_id, "CUSTOMER_CANCELLED")
        async with self._lock:
            self._transition(booking, BookingState.CANCELLED_REFUNDED, "customer cancelled pre-match")
        return booking

    async def sweep_overdue_no_shows(self) -> List[str]:
        """Autonomous background pass: refunds any matched booking with no worker ping past the grace window."""
        refunded: List[str] = []
        deadline_cutoff = utc_now() - timedelta(minutes=settings.NO_SHOW_GRACE_MINUTES * 2)
        async with self._lock:
            candidates = [
                b.booking_id for b in self._bookings.values()
                if b.state == BookingState.MATCHED and not b.worker_pings and (b.scheduled_for or b.created_at) < deadline_cutoff
            ]
        for booking_id in candidates:
            try:
                booking = await self.get_booking(booking_id)
                await self.report_no_show(booking_id, booking.customer_id, force=True)
                refunded.append(booking_id)
            except SmartBrainError as exc:
                workflow_logger.warning("Auto no-show sweep skipped %s: %s", booking_id, exc.message)
            except Exception as exc:
                workflow_logger.exception("Auto no-show sweep crashed on %s: %s", booking_id, exc)
        if refunded:
            workflow_logger.warning("Auto-refunded %d overdue bookings: %s", len(refunded), refunded)
        return refunded

    def stats(self) -> Dict[str, Any]:
        counts: Dict[str, int] = {s.value: 0 for s in BookingState}
        for b in self._bookings.values():
            counts[b.state.value] += 1
        return {"total_bookings": len(self._bookings), "by_state": counts}


# =============================================================================
# 5. API SCHEMAS
# =============================================================================

class TokenRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=128)
    role: str = Field(..., pattern="^(customer|worker|admin)$")
    admin_key: Optional[str] = Field(default=None, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str
    role: str


class WorkerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    skill: str = Field(..., min_length=2, max_length=40)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    rating: float = Field(default=5.0, ge=0, le=5)


class BookingCreateRequest(BaseModel):
    skill: str = Field(..., min_length=2, max_length=40)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    amount: str = Field(..., min_length=1, max_length=16, description="Decimal string, e.g. '49.99'")
    description: str = Field(default="", max_length=500)
    scheduled_for: Optional[datetime] = None

    @field_validator("amount")
    @classmethod
    def _amount_shape(cls, v: str) -> str:
        if not re.fullmatch(r"\d{1,7}(\.\d{1,2})?", v):
            raise ValueError("amount must be a positive decimal with up to 2 places")
        return v


class MatchRequest(BaseModel):
    radius_km: float = Field(default=2.5, ge=settings.MIN_MATCH_RADIUS_KM, le=settings.MAX_MATCH_RADIUS_KM)
    worker_id: Optional[str] = Field(default=None, max_length=128)


class PingRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    accuracy_m: float = Field(default=10.0, gt=0, le=10000)


class CompleteRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    accuracy_m: float = Field(default=10.0, gt=0, le=10000)


class NearbyQuery(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    skill: str = Field(..., min_length=2, max_length=40)
    radius_km: float = Field(default=2.5, ge=settings.MIN_MATCH_RADIUS_KM, le=settings.MAX_MATCH_RADIUS_KM)


def serialize_booking(b: Booking) -> Dict[str, Any]:
    return {
        "booking_id": b.booking_id,
        "customer_id": b.customer_id,
        "worker_id": b.worker_id,
        "skill": b.skill,
        "location": {"lat": b.lat, "lng": b.lng, "s2_cell": b.cell_token},
        "amount": str(b.amount),
        "description": b.description,
        "state": b.state.value,
        "created_at": b.created_at.isoformat(),
        "updated_at": b.updated_at.isoformat(),
        "matched_at": b.matched_at.isoformat() if b.matched_at else None,
        "scheduled_for": b.scheduled_for.isoformat() if b.scheduled_for else None,
        "ping_count": len(b.worker_pings),
        "audit_result": b.audit_result,
        "history": b.history,
    }


def serialize_escrow(r: EscrowRecord) -> Dict[str, Any]:
    return {
        "booking_id": r.booking_id,
        "customer_id": r.customer_id,
        "worker_id": r.worker_id,
        "amount": str(r.amount),
        "status": r.status.value,
        "platform_fee": str(r.platform_fee),
        "worker_payout": str(r.worker_payout),
        "refunded_amount": str(r.refunded_amount),
        "created_at": r.created_at.isoformat(),
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
    }


def serialize_worker(w: WorkerProfile, distance_km: Optional[float] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "worker_id": w.worker_id,
        "name": w.name,
        "skill": w.skill,
        "location": {"lat": w.lat, "lng": w.lng, "s2_cell": w.cell_token},
        "rating": w.rating,
        "available": w.available,
        "last_seen": w.last_seen.isoformat(),
    }
    if distance_km is not None:
        payload["distance_km"] = round(distance_km, 3)
    return payload


# =============================================================================
# 6. APPLICATION WIRING
# =============================================================================

security_brain = SecurityBrain()
geo_manager = S2GeospatialManager()
escrow_gateway = EscrowPaymentGateway()
booking_manager = BookingStateManager(geo_manager, escrow_gateway, security_brain)

bearer_scheme = HTTPBearer(auto_error=False)


def client_key_for(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return ip[:64]


class SecurityMiddleware(BaseHTTPMiddleware):
    """Rate limiting, payload caps, URL hygiene, and hardened response headers on every request."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_key = client_key_for(request)
        try:
            await security_brain.enforce_rate_limit(client_key, request.headers.get("user-agent", ""))
            raw_path = request.url.path
            if security_brain.PATH_TRAVERSAL.search(raw_path) or len(raw_path) > 512:
                security_brain._record_threat(client_key, "MALICIOUS_PATH", raw_path[:128])
                return JSONResponse({"detail": "Rejected"}, status_code=status.HTTP_400_BAD_REQUEST)
            content_length = request.headers.get("content-length")
            if content_length and content_length.isdigit() and int(content_length) > settings.MAX_PAYLOAD_BYTES:
                security_brain._record_threat(client_key, "OVERSIZED_PAYLOAD", content_length)
                return JSONResponse({"detail": "Payload too large"}, status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
            response = await call_next(request)
        except RateLimitExceeded as exc:
            return JSONResponse({"detail": exc.message}, status_code=exc.status_code, headers={"Retry-After": "60"})
        except Exception as exc:
            logger.exception("Middleware failure for %s %s: %s", request.method, request.url.path, exc)
            return JSONResponse({"detail": "Internal error"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response


async def _background_no_show_sweeper() -> None:
    while True:
        try:
            await asyncio.sleep(60)
            await booking_manager.sweep_overdue_no_shows()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            workflow_logger.exception("Sweeper loop error: %s", exc)


from contextlib import asynccontextmanager  # noqa: E402 (grouped with lifespan for readability)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("%s v%s starting on %s:%d (S2 level %d)", settings.APP_NAME, settings.APP_VERSION, settings.HOST, settings.PORT, settings.S2_LEVEL)
    sweeper = asyncio.create_task(_background_no_show_sweeper())
    try:
        yield
    finally:
        sweeper.cancel()
        try:
            await sweeper
        except asyncio.CancelledError:
            pass
        logger.info("Shutdown complete. Final stats: %s", {"escrow": escrow_gateway.stats(), "bookings": booking_manager.stats()})


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Geospatial matching, escrow, GPS-spoof auditing, and real-time threat mitigation in one brain.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Key"],
)


@app.exception_handler(SmartBrainError)
async def smart_brain_error_handler(_: Request, exc: SmartBrainError) -> JSONResponse:
    return JSONResponse({"detail": exc.message, "error": exc.__class__.__name__}, status_code=exc.status_code)


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse({"detail": "Internal server error"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------- Auth dependencies
async def current_principal(
    request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Bearer token required")
    return security_brain.verify_token(credentials.credentials, source=client_key_for(request))


def require_role(*roles: str):
    async def _checker(principal: Dict[str, Any] = Depends(current_principal)) -> Dict[str, Any]:
        if principal.get("role") not in roles:
            security_brain._record_threat(str(principal.get("sub")), "ROLE_ESCALATION_ATTEMPT", f"needed={roles} had={principal.get('role')}")
            raise AuthorizationError("Insufficient role")
        return principal
    return _checker


# ---------------------------------------------------------------- Routes: health & auth
@app.get("/health", tags=["system"])
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "time": utc_now().isoformat(),
        "s2_backend": S2_BACKEND,
        "geo": geo_manager.stats(),
        "escrow": escrow_gateway.stats(),
        "bookings": booking_manager.stats(),
    }


@app.post("/auth/token", response_model=TokenResponse, tags=["auth"])
async def issue_token(body: TokenRequest, request: Request) -> TokenResponse:
    source = client_key_for(request)
    subject = security_brain.sanitize_identifier(body.subject, "subject", source)
    if body.role == "admin":
        security_brain.verify_admin_key(body.admin_key, source)
    token, expires = security_brain.issue_token(subject, body.role)
    return TokenResponse(access_token=token, expires_at=expires.isoformat(), role=body.role)


@app.post("/auth/revoke", tags=["auth"])
async def revoke_token(principal: Dict[str, Any] = Depends(current_principal)) -> Dict[str, str]:
    security_brain.revoke_token(str(principal["jti"]))
    return {"status": "revoked", "jti": str(principal["jti"])}


# ---------------------------------------------------------------- Routes: workers
@app.post("/workers/register", status_code=status.HTTP_201_CREATED, tags=["workers"])
async def register_worker(
    body: WorkerRegisterRequest, request: Request, principal: Dict[str, Any] = Depends(require_role("worker", "admin"))
) -> Dict[str, Any]:
    source = client_key_for(request)
    name = security_brain.sanitize_text(body.name, "name", 80, source)
    skill = security_brain.sanitize_text(body.skill, "skill", 40, source)
    worker = await geo_manager.upsert_worker(str(principal["sub"]), name, skill, body.lat, body.lng, body.rating)
    return serialize_worker(worker)


@app.post("/workers/availability", tags=["workers"])
async def set_availability(available: bool, principal: Dict[str, Any] = Depends(require_role("worker"))) -> Dict[str, Any]:
    await geo_manager.set_availability(str(principal["sub"]), available)
    return serialize_worker(await geo_manager.get_worker(str(principal["sub"])))


@app.post("/workers/nearby", tags=["workers"])
async def nearby_workers(
    body: NearbyQuery, request: Request, _: Dict[str, Any] = Depends(current_principal)
) -> Dict[str, Any]:
    skill = security_brain.sanitize_text(body.skill, "skill", 40, client_key_for(request))
    results = await geo_manager.find_nearby_workers(body.lat, body.lng, skill, body.radius_km)
    return {
        "query_cell": geo_manager.cell_token(body.lat, body.lng),
        "cells_scanned": len(geo_manager.neighbor_tokens(body.lat, body.lng, geo_manager.rings_for_radius(body.radius_km))),
        "workers": [serialize_worker(w, d) for w, d in results],
    }


# ---------------------------------------------------------------- Routes: bookings
@app.post("/bookings", status_code=status.HTTP_201_CREATED, tags=["bookings"])
async def create_booking(
    body: BookingCreateRequest, request: Request, principal: Dict[str, Any] = Depends(require_role("customer"))
) -> Dict[str, Any]:
    source = client_key_for(request)
    skill = security_brain.sanitize_text(body.skill, "skill", 40, source)
    description = security_brain.sanitize_text(body.description, "description", 500, source) if body.description else ""
    if body.scheduled_for and body.scheduled_for.tzinfo is None:
        body.scheduled_for = body.scheduled_for.replace(tzinfo=timezone.utc)
    booking = await booking_manager.create_booking(
        str(principal["sub"]), skill, body.lat, body.lng, body.amount, description, body.scheduled_for
    )
    escrow = await escrow_gateway.get_record(booking.booking_id)
    return {"booking": serialize_booking(booking), "escrow": serialize_escrow(escrow)}


@app.get("/bookings/{booking_id}", tags=["bookings"])
async def get_booking(
    booking_id: str, request: Request, principal: Dict[str, Any] = Depends(current_principal)
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    booking = await booking_manager.get_booking(booking_id)
    sub = str(principal["sub"])
    if principal.get("role") != "admin" and sub not in (booking.customer_id, booking.worker_id):
        raise AuthorizationError("Not a party to this booking")
    escrow = await escrow_gateway.get_record(booking_id)
    return {"booking": serialize_booking(booking), "escrow": serialize_escrow(escrow)}


@app.post("/bookings/{booking_id}/match", tags=["bookings"])
async def match_booking(
    booking_id: str, body: MatchRequest, request: Request, principal: Dict[str, Any] = Depends(require_role("customer", "admin"))
) -> Dict[str, Any]:
    source = client_key_for(request)
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", source)
    booking = await booking_manager.get_booking(booking_id)
    if principal.get("role") != "admin" and booking.customer_id != str(principal["sub"]):
        raise AuthorizationError("Not the owner of this booking")
    worker_id = security_brain.sanitize_identifier(body.worker_id, "worker_id", source) if body.worker_id else None
    booking = await booking_manager.match_worker(booking_id, body.radius_km, worker_id)
    worker = await geo_manager.get_worker(str(booking.worker_id))
    return {"booking": serialize_booking(booking), "worker": serialize_worker(worker, haversine_km(booking.lat, booking.lng, worker.lat, worker.lng))}


@app.post("/bookings/{booking_id}/ping", tags=["bookings"])
async def worker_ping(
    booking_id: str, body: PingRequest, request: Request, principal: Dict[str, Any] = Depends(require_role("worker"))
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    booking = await booking_manager.record_worker_ping(booking_id, str(principal["sub"]), body.lat, body.lng, body.accuracy_m)
    return {"booking_id": booking.booking_id, "ping_count": len(booking.worker_pings), "state": booking.state.value}


@app.post("/bookings/{booking_id}/complete", tags=["bookings"])
async def complete_booking(
    booking_id: str, body: CompleteRequest, request: Request, principal: Dict[str, Any] = Depends(require_role("worker"))
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    booking = await booking_manager.complete_booking(booking_id, str(principal["sub"]), body.lat, body.lng, body.accuracy_m)
    escrow = await escrow_gateway.get_record(booking_id)
    return {"booking": serialize_booking(booking), "escrow": serialize_escrow(escrow)}


@app.post("/bookings/{booking_id}/no-show", tags=["bookings"])
async def report_no_show(
    booking_id: str, request: Request, principal: Dict[str, Any] = Depends(require_role("customer", "admin"))
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    is_admin = principal.get("role") == "admin"
    booking = await booking_manager.report_no_show(booking_id, str(principal["sub"]), force=is_admin)
    escrow = await escrow_gateway.get_record(booking_id)
    return {"booking": serialize_booking(booking), "escrow": serialize_escrow(escrow)}


@app.post("/bookings/{booking_id}/cancel", tags=["bookings"])
async def cancel_booking(
    booking_id: str, request: Request, principal: Dict[str, Any] = Depends(require_role("customer"))
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    booking = await booking_manager.cancel_booking(booking_id, str(principal["sub"]))
    escrow = await escrow_gateway.get_record(booking_id)
    return {"booking": serialize_booking(booking), "escrow": serialize_escrow(escrow)}


# ---------------------------------------------------------------- Routes: security & admin
@app.post("/security/audit", tags=["security"])
async def security_audit(_: Dict[str, Any] = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Runs the full automated audit: threat log, ledger integrity, overdue no-show sweep, GPS re-audit of flagged bookings."""
    refunded = await booking_manager.sweep_overdue_no_shows()
    ledger_ok, break_seq = escrow_gateway.verify_ledger_integrity()
    flagged: List[Dict[str, Any]] = []
    async with booking_manager._lock:
        for b in booking_manager._bookings.values():
            if b.state == BookingState.FLAGGED_SPOOF:
                flagged.append({"booking_id": b.booking_id, "worker_id": b.worker_id, "audit": b.audit_result})
    return {
        "audited_at": utc_now().isoformat(),
        "threats": security_brain.threat_report(limit=100),
        "ledger": {"intact": ledger_ok, "break_seq": break_seq, **escrow_gateway.stats()},
        "auto_refunded_no_shows": refunded,
        "flagged_spoof_bookings": flagged,
        "geo": geo_manager.stats(),
        "bookings": booking_manager.stats(),
    }


@app.post("/security/sanitize-test", tags=["security"])
async def sanitize_test(payload: Dict[str, str], request: Request, _: Dict[str, Any] = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Admin utility to probe the sanitizer with arbitrary strings without touching business data."""
    source = client_key_for(request)
    results: Dict[str, Any] = {}
    for key, value in list(payload.items())[:20]:
        try:
            results[key] = {"accepted": True, "sanitized": security_brain.sanitize_text(str(value), key, 512, source)}
        except SecurityViolation as exc:
            results[key] = {"accepted": False, "reason": exc.message}
    return results


@app.get("/escrow/{booking_id}", tags=["finance"])
async def get_escrow(
    booking_id: str, request: Request, principal: Dict[str, Any] = Depends(current_principal)
) -> Dict[str, Any]:
    booking_id = security_brain.sanitize_identifier(booking_id, "booking_id", client_key_for(request))
    record = await escrow_gateway.get_record(booking_id)
    if principal.get("role") != "admin" and str(principal["sub"]) not in (record.customer_id, record.worker_id):
        raise AuthorizationError("Not a party to this escrow")
    return serialize_escrow(record)


# =============================================================================
# 7. SERVER ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    try:
        uvicorn.run(
            "smart_brain:app",
            host=settings.HOST,
            port=settings.PORT,
            log_level="info",
            proxy_headers=True,
            forwarded_allow_ips="*",
            server_header=False,
            date_header=False,
        )
    except KeyboardInterrupt:
        logger.info("Interrupted; shutting down.")
    except Exception as exc:
        logger.critical("Server failed to start: %s", exc, exc_info=True)
        sys.exit(1)
