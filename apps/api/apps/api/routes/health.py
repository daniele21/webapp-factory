from fastapi import APIRouter, Response

router = APIRouter()

@router.get("/healthz")
async def healthz():
    return {"status": "ok"}

@router.get("/readyz")
async def readyz(response: Response):
    # TODO: check Firestore & Redis connectivity
    response.headers['Cache-Control'] = 'no-store'
    return {"ready": True}
