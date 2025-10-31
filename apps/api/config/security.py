"""Security header configuration loader with CSP + HSTS support."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


def _default_sources(*values: str) -> List[str]:
    return list(values)


class CSPTenantOverride(BaseModel):
    default: Optional[List[str]] = None
    script: Optional[List[str]] = None
    style: Optional[List[str]] = None
    img: Optional[List[str]] = None
    connect: Optional[List[str]] = None
    font: Optional[List[str]] = None
    frame: Optional[List[str]] = None
    media: Optional[List[str]] = None
    manifest: Optional[List[str]] = None
    worker: Optional[List[str]] = None
    frame_ancestors: Optional[List[str]] = Field(default=None, alias="frameAncestors")
    directives: Dict[str, List[str]] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class CSPDirectives(BaseModel):
    default: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    script: List[str] = Field(default_factory=lambda: _default_sources("'self'", "'unsafe-inline'"))
    style: List[str] = Field(default_factory=lambda: _default_sources("'self'", "'unsafe-inline'"))
    img: List[str] = Field(default_factory=lambda: _default_sources("'self'", 'data:'))
    connect: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    font: List[str] = Field(default_factory=lambda: _default_sources("'self'", 'data:'))
    frame: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    media: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    manifest: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    worker: List[str] = Field(default_factory=lambda: _default_sources("'self'"))
    frame_ancestors: List[str] = Field(default_factory=lambda: _default_sources("'self'"), alias="frameAncestors")
    directives: Dict[str, List[str]] = Field(default_factory=dict)
    per_tenant: Dict[str, CSPTenantOverride] = Field(default_factory=dict, alias="perTenant")
    report_only: bool = Field(default=False, alias="reportOnly")
    report_to: Optional[str] = Field(default=None, alias="reportTo")
    report_uri: Optional[str] = Field(default=None, alias="reportUri")
    upgrade_insecure_requests: bool = Field(default=True, alias="upgradeInsecureRequests")

    model_config = ConfigDict(populate_by_name=True)


class HSTSConfig(BaseModel):
    enabled: bool = True
    max_age: int = Field(default=31536000, alias="maxAge")
    include_subdomains: bool = Field(default=True, alias="includeSubDomains")
    preload: bool = False

    model_config = ConfigDict(populate_by_name=True)


class SecurityHeadersConfig(BaseModel):
    csp: CSPDirectives = Field(default_factory=CSPDirectives)
    hsts: Union[bool, HSTSConfig] = True
    referrer_policy: str = Field(default="strict-origin-when-cross-origin", alias="referrerPolicy")
    permissions_policy: Dict[str, str] = Field(
        default_factory=lambda: {
            'accelerometer': '()',
            'camera': '()',
            'geolocation': '()',
            'gyroscope': '()',
            'magnetometer': '()',
            'microphone': '()',
            'payment': '()',
            'usb': '()',
        },
        alias="permissionsPolicy",
    )

    model_config = ConfigDict(populate_by_name=True)


def _load_from_path(path: Path) -> SecurityHeadersConfig:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return SecurityHeadersConfig(**data)


DEFAULT_SECURITY_CONFIG = SecurityHeadersConfig()


@lru_cache(maxsize=1)
def get_security_config() -> SecurityHeadersConfig:
    """Load security header configuration from JSON path or environment defaults."""

    path = os.getenv("APP_SECURITY_CONFIG_PATH")
    if path:
        candidate = Path(path)
        if candidate.exists():
            try:
                return _load_from_path(candidate)
            except Exception:  # pragma: no cover - invalid configs fallback to defaults
                return DEFAULT_SECURITY_CONFIG

    inline_json = os.getenv("APP_SECURITY_CONFIG_JSON")
    if inline_json:
        try:
            return SecurityHeadersConfig(**json.loads(inline_json))
        except Exception:  # pragma: no cover - invalid configs fallback to defaults
            return DEFAULT_SECURITY_CONFIG

    return DEFAULT_SECURITY_CONFIG


__all__ = [
    "CSPDirectives",
    "CSPTenantOverride",
    "HSTSConfig",
    "SecurityHeadersConfig",
    "get_security_config",
]
