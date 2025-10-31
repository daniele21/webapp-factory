"""Middleware that applies CSP, HSTS, and related security headers."""

from __future__ import annotations

import os
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..config.security import CSPDirectives, HSTSConfig, SecurityHeadersConfig, get_security_config
from ..settings import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Apply opinionated security headers based on configuration."""

    def __init__(self, app):
        super().__init__(app)
        self._connect_extras = self._collect_connect_sources()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        config = get_security_config()

        tenant_id = self._resolve_tenant(request)
        header_name, csp_value = self._build_csp_header(config.csp, tenant_id)
        response.headers[header_name] = csp_value

        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = config.referrer_policy

        permissions_policy = self._build_permissions_policy(config.permissions_policy)
        if permissions_policy:
            response.headers['Permissions-Policy'] = permissions_policy

        self._apply_hsts(response, config.hsts)

        return response

    def _build_csp_header(self, csp: CSPDirectives, tenant: Optional[str]) -> Tuple[str, str]:
        overrides = csp.per_tenant.get(tenant) if tenant else None

        directives: List[str] = []
        mapping: Sequence[Tuple[str, str]] = (
            ('default-src', 'default'),
            ('script-src', 'script'),
            ('style-src', 'style'),
            ('img-src', 'img'),
            ('connect-src', 'connect'),
            ('font-src', 'font'),
            ('frame-src', 'frame'),
            ('media-src', 'media'),
            ('manifest-src', 'manifest'),
            ('worker-src', 'worker'),
            ('frame-ancestors', 'frame_ancestors'),
        )

        for directive_name, attr in mapping:
            base_values = getattr(csp, attr)
            merged = self._merge_sources(base_values, getattr(overrides, attr, None) if overrides else None)
            if directive_name == 'connect-src':
                merged = self._merge_sources(merged, self._connect_extras)
            if merged:
                directives.append(f"{directive_name} {' '.join(merged)}")

        custom_directives: Dict[str, List[str]] = {**csp.directives}
        if overrides:
            for name, values in overrides.directives.items():
                custom_directives[name] = self._merge_sources(custom_directives.get(name, []), values)

        for name, values in custom_directives.items():
            if values:
                directives.append(f"{name} {' '.join(self._normalize(values))}")

        if csp.upgrade_insecure_requests:
            directives.append('upgrade-insecure-requests')
        if csp.report_to:
            directives.append(f"report-to {csp.report_to}")
        if csp.report_uri:
            directives.append(f"report-uri {csp.report_uri}")

        header_name = 'Content-Security-Policy-Report-Only' if csp.report_only else 'Content-Security-Policy'
        return header_name, '; '.join(directives)

    def _merge_sources(
        self,
        base: Iterable[str],
        extra: Optional[Iterable[str]],
    ) -> List[str]:
        merged: List[str] = []
        for value in self._normalize(base):
            if value not in merged:
                merged.append(value)
        if extra:
            for value in self._normalize(extra):
                if value not in merged:
                    merged.append(value)
        return merged

    @staticmethod
    def _normalize(values: Iterable[str]) -> List[str]:
        return [value.strip() for value in values if value and value.strip()]

    @staticmethod
    def _resolve_tenant(request: Request) -> Optional[str]:
        header_keys = ('x-tenant-id', 'x-tenant', 'x-org-id')
        for key in header_keys:
            value = request.headers.get(key)
            if value:
                return value.strip().lower()
        tenant = request.query_params.get('tenant')
        return tenant.strip().lower() if tenant else None

    def _collect_connect_sources(self) -> List[str]:
        origins = set()
        auth_config = getattr(settings, 'auth_config', None)
        if auth_config and getattr(auth_config, 'cors_origins', None):
            origins.update(auth_config.cors_origins)

        env_origins = os.getenv('APP_CORS_ORIGINS')
        if env_origins:
            origins.update(item.strip() for item in env_origins.split(',') if item.strip())

        origins.update({'https://accounts.google.com', 'https://oauth2.googleapis.com'})
        return sorted(origins)

    def _apply_hsts(self, response: Response, hsts_config: bool | HSTSConfig) -> None:
        if isinstance(hsts_config, bool):
            enabled = hsts_config
            config = HSTSConfig() if hsts_config else None
        else:
            enabled = hsts_config.enabled
            config = hsts_config

        if not enabled or not config:
            return
        if settings.ENV != 'production':  # Maintain conservative default outside production
            return

        header = f"max-age={config.max_age}"
        if config.include_subdomains:
            header += '; includeSubDomains'
        if config.preload:
            header += '; preload'
        response.headers['Strict-Transport-Security'] = header

    @staticmethod
    def _build_permissions_policy(policy: Dict[str, str]) -> Optional[str]:
        if not policy:
            return None
        parts = []
        for feature, value in policy.items():
            trimmed = value.strip()
            if not trimmed:
                continue
            if trimmed.startswith('('):
                parts.append(f"{feature}={trimmed}")
            else:
                parts.append(f"{feature}=({trimmed})")
        return ', '.join(parts) if parts else None
