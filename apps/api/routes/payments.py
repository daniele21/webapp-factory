from fastapi import APIRouter, Request, HTTPException
from ..providers.stripe import stripe, verify_signature

router = APIRouter()

@router.post('/webhook')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get('stripe-signature')
    try:
        event = verify_signature(payload, sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    # TODO: handle events -> update entitlements
    return {"received": True}
