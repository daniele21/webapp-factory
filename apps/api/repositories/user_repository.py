from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import anyio
from google.cloud import firestore

from ..providers.firestore import get_collection_name, get_firestore_client


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ListUsersResult:
    items: List[Dict[str, Any]]
    next_cursor: Optional[str]


class FirestoreUserRepository:
    """
    Thin repository around the `users` collection in Firestore.

    The repository intentionally works with plain dicts; higher layers (services)
    handle Pydantic models so this stays framework agnostic.
    """

    def __init__(self, client: Optional[firestore.Client] = None, collection_name: Optional[str] = None):
        self._client = client or get_firestore_client()
        self._collection_name = collection_name or get_collection_name("users", "users")
        self._collection = self._client.collection(self._collection_name)

    async def get(self, user_id: str) -> Optional[Dict[str, Any]]:
        snapshot = await anyio.to_thread.run_sync(lambda: self._collection.document(user_id).get())
        data = snapshot.to_dict()
        if not data:
            return None
        return self._serialize(snapshot.id, data)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        def _query():
            return list(
                self._collection.where("email", "==", email.lower()).limit(1).stream()
            )

        results = await anyio.to_thread.run_sync(_query)
        if not results:
            return None
        snap = results[0]
        return self._serialize(snap.id, snap.to_dict())

    async def upsert(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update a user profile. Automatically sets created/updated timestamps.
        """
        now = _utcnow()

        def _write():
            doc_ref = self._collection.document(user_id)
            snapshot = doc_ref.get()
            existing = snapshot.to_dict() or {}

            created_at = existing.get("created_at") or now

            # Normalise email for consistent querying
            if "email" in payload:
                payload["email"] = payload["email"].lower()

            updated = {
                **existing,
                **payload,
                "created_at": created_at,
                "updated_at": now,
            }
            if payload.get("last_login_at"):
                updated["last_login_at"] = payload["last_login_at"]
            elif not existing.get("last_login_at"):
                updated["last_login_at"] = now

            doc_ref.set(updated, merge=True)
            return doc_ref.get()

        snapshot = await anyio.to_thread.run_sync(_write)
        return self._serialize(snapshot.id, snapshot.to_dict() or {})

    async def list(self, *, limit: int = 25, cursor: Optional[str] = None) -> ListUsersResult:
        limit = max(1, min(limit, 100))

        def _query():
            query = self._collection.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
            if cursor:
                cursor_ref = self._collection.document(cursor).get()
                if cursor_ref.exists:
                    query = query.start_after(cursor_ref)
            return list(query.stream())

        snapshots = await anyio.to_thread.run_sync(_query)
        items = [self._serialize(s.id, s.to_dict() or {}) for s in snapshots]
        next_cursor = snapshots[-1].id if snapshots and len(snapshots) == limit else None
        return ListUsersResult(items=items, next_cursor=next_cursor)

    async def delete(self, user_id: str) -> None:
        await anyio.to_thread.run_sync(lambda: self._collection.document(user_id).delete())

    @staticmethod
    def _serialize(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert raw Firestore data into serializable dict with ISO timestamps.
        """
        def _to_iso(value: Any) -> Optional[str]:
            if value is None:
                return None
            if isinstance(value, datetime):
                return value.astimezone(timezone.utc).isoformat()
            return value

        return {
            "id": user_id,
            **{k: v for k, v in data.items() if k not in {"id"}},
            "created_at": _to_iso(data.get("created_at")),
            "updated_at": _to_iso(data.get("updated_at")),
            "last_login_at": _to_iso(data.get("last_login_at")),
        }


_repository: Optional[FirestoreUserRepository] = None


def get_user_repository() -> FirestoreUserRepository:
    global _repository
    if _repository is None:
        _repository = FirestoreUserRepository()
    return _repository
