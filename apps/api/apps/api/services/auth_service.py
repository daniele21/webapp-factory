from dataclasses import dataclass
from typing import Optional
import jwt, secrets, time
from ..settings import settings

@dataclass
class Session:
    token: str

# NOTE: For template purposes we skip real Google exchange.
# In production, integrate with Google OAuth and verify ID token.

def build_login_url(redirect: str) -> str:
    # Redirect SPA to this URL; backend would normally redirect to Google.
    return f"{redirect}?login=google"

async def exchange_code(code: str, state: str) -> Session:
    claims = {"sub": "user_1", "email": "demo@example.com", "roles": ["user"], "iat": int(time.time())}
    token = jwt.encode(claims, settings.jwt_secret, algorithm="HS256")
    return Session(token=token)

async def get_current_user(token: Optional[str] = None):
    # In real setup, read from cookie; simplified for template
    return {"id": "user_1", "email": "demo@example.com", "roles": ["user"]}

def logout_user(response):
    response.delete_cookie("session")
