import uuid
from starlette.types import ASGIApp, Receive, Scope, Send

class RequestIDMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope['type'] == 'http':
            scope['headers'].append((b'x-request-id', uuid.uuid4().hex.encode()))
        await self.app(scope, receive, send)
