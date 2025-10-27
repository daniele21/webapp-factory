from fastapi import HTTPException, Request

async def require_roles(roles: list[str]):
    async def dep(request: Request):
        # In real setup: parse JWT from cookie/header
        user_roles = ["admin"] if request.headers.get('x-demo-admin') else ["user"]
        if not any(r in user_roles for r in roles):
            raise HTTPException(status_code=403, detail="forbidden")
    return dep
