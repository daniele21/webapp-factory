import base64, hashlib, hmac, json, requests

secret = "shpss_example"  # must match APP_SHOPIFY_WEBHOOK_SECRET
payload = {
    "id": 987654321,
    "order_number": 42,
    "currency": "USD",
    "total_price": "19.99",
    "note_attributes": [
        {"name": "google_email", "value": "user@example.com"},
        {"name": "plan", "value": "pro"},
        {"name": "credits", "value": "250"}
    ]
}

body = json.dumps(payload).encode()
signature = base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()

resp = requests.post(
    "http://127.0.0.1:8000/payments/webhook/shopify",  # adjust host:port if needed
    headers={
        "Content-Type": "application/json",
        "X-Shopify-Topic": "orders/paid",
        "X-Shopify-Hmac-Sha256": signature,
    },
    data=body,
    timeout=10,
)
print(resp.status_code, resp.json())
