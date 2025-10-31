from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.settings import settings
from api.routes import health, auth, users, protected, google_auth, payments, consent, notifications
from api.middleware.request_id import RequestIDMiddleware
from api.middleware.logging import LoggingMiddleware
from api.middleware.security_headers import SecurityHeadersMiddleware


app = FastAPI(title="Webapp Factory API", version="1.0.0")

import logging
logger = logging.getLogger("uvicorn.error")


@app.on_event("startup")
def log_startup_info():
    try:
        # Print some auth-related configuration so users can see missing values at startup
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        client_secret_present = bool(getattr(settings, 'GOOGLE_CLIENT_SECRET', None))
        try:
            redirect_uri = __import__('api.services.auth_service', fromlist=['_get_redirect_uri'])._get_redirect_uri('google')
        except Exception:
            redirect_uri = None
        logger.info("Auth startup: GOOGLE_CLIENT_ID=%s GOOGLE_CLIENT_SECRET_PRESENT=%s OAUTH_REDIRECT_URI=%s", client_id, client_secret_present, redirect_uri)
    except Exception:
        logger.exception("Failed to log startup auth info")

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
# New Google OAuth routes with GIS popup flow
app.include_router(google_auth.router, prefix="/auth", tags=["auth", "google"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(protected.router)
app.include_router(consent.router)
app.include_router(notifications.router)

# Prometheus metrics endpoint
from prometheus_client import make_asgi_app
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
