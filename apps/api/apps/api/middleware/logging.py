import json, time
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        resp = await call_next(request)
        dur = int((time.time() - start) * 1000)
        log = {
            "ts": time.time(),
            "method": request.method,
            "path": request.url.path,
            "status": resp.status_code,
            "duration_ms": dur,
        }
        print(json.dumps(log))
        return resp
