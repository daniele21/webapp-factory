from fastapi import APIRouter, Depends
from ..services.user_service import get_user_by_id
from ..security.guards import require_roles

router = APIRouter()

@router.get("/{user_id}", dependencies=[Depends(require_roles(["admin"]))])
async def get_user(user_id: str):
    return await get_user_by_id(user_id)
