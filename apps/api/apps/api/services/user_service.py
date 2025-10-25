async def get_user_by_id(user_id: str):
    # Minimal stub used by the scaffold routes. Replace with Firestore lookup in production.
    return {"id": user_id, "email": f"{user_id}@example.com", "roles": ["user"]}
