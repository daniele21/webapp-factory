from fastapi import APIRouter, Depends, Response, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
import logging

from api.services.auth_service import build_login_url, exchange_code, get_current_user, logout_user, OAUTH_PROVIDERS, get_provider, _get_redirect_uri

logger = logging.getLogger("uvicorn.error")
from api.settings import settings

router = APIRouter()


@router.get("/{provider}/login")
async def oauth_login(provider: str, redirect: str):
    """
    Initiate OAuth flow for any supported provider.
    
    Supported providers: google, github, slack
    
    This endpoint redirects the browser to the provider's OAuth consent screen.
    After the user authorizes, the provider redirects back to /{provider}/callback.
    """
    # Log provider/client info to help debug invalid_client issues
    try:
        prov = get_provider(provider)
        try:
            client_id, _ = prov.get_credentials()
        except HTTPException:
            # credentials missing will be raised by get_credentials; log and re-raise
            logger.error("OAuth credentials missing for provider %s", provider)
            raise
        resolved_redirect = _get_redirect_uri(provider)
        logger.info("OAuth login requested for provider=%s client_id=%s redirect_param=%s resolved_redirect_uri=%s", provider, client_id, redirect, resolved_redirect)
    except Exception:
        # If get_provider or get_credentials failed, let the error propagate after logging
        logger.exception("Error preparing OAuth login for provider %s", provider)
        raise

    auth_url = build_login_url(provider, redirect)
    logger.info("Redirecting to OAuth provider URL for %s", provider)
    return RedirectResponse(url=auth_url)


@router.get("/{provider}/callback")
async def oauth_callback(provider: str, code: str, state: str, response: Response):
        """
        Handle OAuth callback from any provider.

        This returns an HTML page that sets the session cookie (so the browser
        receives it) and then notifies the opener window via postMessage and
        closes the popup. If there is no opener it redirects the top-level page
        to the frontend URL.
        """

        # Exchange auth code for session token
        session = await exchange_code(provider, code, state)

        # Prepare frontend redirect and origin
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', None)
        if not frontend_url:
                raise HTTPException(status_code=500, detail="Frontend base URL not configured. Set APP_FRONTEND_BASE_URL or settings.FRONTEND_BASE_URL.")

        from urllib.parse import urlparse
        p = urlparse(frontend_url)
        frontend_origin = f"{p.scheme}://{p.netloc}"

        # NOTE: we include the session token in the postMessage payload so that
        # popup-based flows can receive a token even when cookies are not sent by
        # the browser (common in cross-origin dev). The token is only sent to the
        # configured frontend origin.
        html = f"""
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Authentication complete</title>
        </head>
        <body>
            <script>
                (function() {{
                    try {{
                                    if (window.opener) {{
                                        window.opener.postMessage({{ type: 'oauth', provider: '{provider}', status: 'success', token: '{session.token}' }}, '{frontend_origin}');
                            setTimeout(function() {{ window.close(); }}, 100);
                        }} else {{
                            window.location.href = '{frontend_url}';
                        }}
                    }} catch (e) {{
                        window.location.href = '{frontend_url}';
                    }}
                }})();
            </script>
            <p>Authentication complete. You can close this window.</p>
        </body>
        </html>
        """

        resp = HTMLResponse(content=html, status_code=200)
        resp.set_cookie(
                key="session",
                value=session.token,
                httponly=True,
                samesite="lax",
                max_age=60 * 60 * 24 * 7,  # 7 days
                secure=False,
        )
        return resp


@router.get("/me")
async def me(request: Request):
    """Get current user information from session."""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post('/logout')
async def logout(response: Response):
    """Sign out and clear session cookie."""
    logout_user(response)
    return {"ok": True}


@router.get("/providers")
async def list_providers():
    """List all supported OAuth providers."""
    return {
        "providers": list(OAUTH_PROVIDERS.keys()),
        "details": {
            name: {
                "name": provider.name,
                "scopes": provider.scopes,
            }
            for name, provider in OAUTH_PROVIDERS.items()
        }
    }

