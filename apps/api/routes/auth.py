from fastapi import APIRouter, Depends, Response, Request, HTTPException
from ..services.auth_service import build_login_url, exchange_code, get_current_user, logout_user

router = APIRouter()

@router.get("/google/login")
async def google_login(redirect: str):
    return {"redirect": build_login_url(redirect)}

@router.get("/google/callback")
async def google_callback(code: str, state: str, response: Response):
    # Exchange auth code -> session cookie/JWT
    session = await exchange_code(code, state)
    response.set_cookie("session", session.token, httponly=True, samesite="lax")
    return {"ok": True}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user

@router.post('/logout')
async def logout(response: Response):
    logout_user(response)
    return {"ok": True}
