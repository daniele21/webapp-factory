import os
from functools import lru_cache
from typing import Optional

from google.cloud import firestore

from ..settings import settings

_client: Optional[firestore.Client] = None


def _resolve_project_id() -> str:
    """Resolve the Firestore project ID from settings or environment."""
    # The config system exposes GOOGLE_PROJECT_ID via settings; fall back to env vars
    project_id = getattr(settings, "GOOGLE_PROJECT_ID", None) or os.getenv("GOOGLE_PROJECT_ID")
    if project_id:
        return project_id

    # As a final fallback, let Firestore infer project ID (e.g. from credentials)
    return firestore.Client().project


def _ensure_emulator_environment():
    """Configure Firestore emulator environment variables when enabled."""
    db_config = getattr(settings, "_database_config", None)
    if not db_config or not getattr(db_config.firestore, "use_emulator", False):
        return

    host = db_config.firestore.emulator_host or os.getenv("FIRESTORE_EMULATOR_HOST")
    if host:
        os.environ.setdefault("FIRESTORE_EMULATOR_HOST", host)


def get_firestore_client() -> firestore.Client:
    """
    Return a cached Firestore client configured for the current environment.

    - Reuses the same client instance to avoid connection churn.
    - Honours emulator configuration via settings or env vars.
    """
    global _client
    if _client is not None:
        return _client

    _ensure_emulator_environment()
    project_id = _resolve_project_id()
    _client = firestore.Client(project=project_id)
    return _client


def reset_firestore_client():
    """Reset the cached Firestore client. Useful for tests."""
    global _client
    _client = None


def get_collection_name(key: str, default: str) -> str:
    """
    Resolve a Firestore collection name from database configuration.
    Falls back to the provided default when no override is present.
    """
    db_config = getattr(settings, "_database_config", None)
    if not db_config or not getattr(db_config, "firestore", None):
        return default
    return db_config.firestore.collections.get(key, default)


# Backwards compatibility export (legacy code expected `client()`)
def client() -> firestore.Client:
    return get_firestore_client()
