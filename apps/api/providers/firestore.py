import os
import logging
from functools import lru_cache
from typing import Optional

from google.cloud import firestore

from ..settings import settings

logger = logging.getLogger("uvicorn.error")

_client: Optional[firestore.Client] = None


def _resolve_project_id() -> str:
    """Resolve the Firestore project ID from settings or environment."""
    # The config system exposes GOOGLE_PROJECT_ID via settings; fall back to env vars
    # Prefer explicit APP_ env var (from .env files) so local overrides work, then settings, then legacy env
    project_id = os.getenv("APP_GOOGLE_PROJECT_ID") or getattr(settings, "GOOGLE_PROJECT_ID", None) or os.getenv("GOOGLE_PROJECT_ID")
    if project_id:
        logger.debug("Resolved Firestore project id from env/settings: %s", project_id)
        return project_id

    # As a final fallback, let Firestore infer project ID (e.g. from credentials)
    inferred = firestore.Client().project
    logger.debug("No explicit Firestore project id found; inferred from credentials: %s", inferred)
    return inferred


def _resolve_database_id() -> str:
    """Resolve the Firestore database id from settings or environment."""
    db_config = getattr(settings, "_database_config", None)
    # Prefer explicit APP env var, then settings value (unless it's the placeholder '(default)'), then legacy env var
    env_db = os.getenv('APP_FIRESTORE_DATABASE_ID') or os.getenv('FIRESTORE_DATABASE_ID')
    if env_db:
        logger.debug("Resolved Firestore database id from env: %s", env_db)
        return env_db

    db_id = None
    if db_config and getattr(db_config, 'firestore', None):
        db_id = getattr(db_config.firestore, 'database_id', None)
    # Treat the placeholder '(default)' as unset
    if db_id and db_id != "(default)":
        logger.debug("Resolved Firestore database id from settings: %s", db_id)
        return db_id

    # Fallback to settings default or literal '(default)'
    fallback = getattr(settings, 'database', None).firestore.database_id if getattr(settings, 'database', None) else '(default)'
    logger.debug("Using fallback Firestore database id: %s", fallback)
    return fallback


def _ensure_emulator_environment():
    """Configure Firestore emulator environment variables when enabled."""
    db_config = getattr(settings, "_database_config", None)
    # If emulator is explicitly disabled, ensure any emulator env vars are removed
    use_emulator = False
    if db_config and getattr(db_config.firestore, "use_emulator", False):
        use_emulator = True

    if not use_emulator:
        # Remove emulator env vars to avoid accidental use of a leftover setting
        removed = False
        for key in ("FIRESTORE_EMULATOR_HOST", "APP_FIRESTORE_EMULATOR_HOST"):
            if key in os.environ:
                os.environ.pop(key, None)
                removed = True
        if removed:
            logger.debug("Firestore emulator disabled in configuration; removed emulator env vars")
        else:
            logger.debug("Firestore emulator not enabled in configuration")
        return

    host = db_config.firestore.emulator_host or os.getenv("FIRESTORE_EMULATOR_HOST")
    if host:
        os.environ.setdefault("FIRESTORE_EMULATOR_HOST", host)
        logger.info("Configured Firestore emulator host: %s", host)


def _ensure_credentials_fallback():
    """Ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid credentials file.

    If the environment variable is unset or points to a non-existing file, and a
    repo-local `firestore-access.json` exists, set GOOGLE_APPLICATION_CREDENTIALS
    to that path. This is a convenience for local development only.
    """
    env_key = "GOOGLE_APPLICATION_CREDENTIALS"
    val = os.getenv(env_key)
    repo_creds = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '..', 'firestore-access.json')
    # normalize path
    repo_creds = os.path.normpath(repo_creds)
    # If env is set and the file exists, do nothing
    if val and os.path.exists(val):
        logger.debug("Using GOOGLE_APPLICATION_CREDENTIALS from environment: %s", val)
        return

    # If env is set but file missing, log and continue to try repo creds
    if val and not os.path.exists(val):
        logger.warning("GOOGLE_APPLICATION_CREDENTIALS is set but file not found: %s", val)

    # If repo creds file exists, set it
    if os.path.exists(repo_creds):
        os.environ[env_key] = repo_creds
        logger.info("Set %s to repository credentials file: %s", env_key, repo_creds)
    else:
        logger.debug("No repository credentials file found at: %s", repo_creds)


def get_firestore_client() -> firestore.Client:
    """
    Return a cached Firestore client configured for the current environment.

    - Reuses the same client instance to avoid connection churn.
    - Honours emulator configuration via settings or env vars.
    """
    global _client
    if _client is not None:
        logger.debug("Reusing cached Firestore client for project: %s", getattr(_client, 'project', None))
        return _client

    _ensure_emulator_environment()
    _ensure_credentials_fallback()
    project_id = _resolve_project_id()
    database_id = _resolve_database_id()
    logger.info("Creating Firestore client for project: %s database: %s", project_id, database_id)
    # Pass database id to client when supported
    try:
        _client = firestore.Client(project=project_id, database=database_id)
    except TypeError:
        # Older google-cloud-firestore versions may not accept `database` param
        logger.debug("firestore.Client does not accept 'database' parameter, creating client without database argument")
        _client = firestore.Client(project=project_id)
    logger.debug("Firestore client created: %s", getattr(_client, '__class__', str(_client)))
    return _client


def reset_firestore_client():
    """Reset the cached Firestore client. Useful for tests."""
    global _client
    logger.info("Resetting cached Firestore client")
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
