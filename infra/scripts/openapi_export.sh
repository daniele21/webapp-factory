#!/usr/bin/env bash
set -euo pipefail
# Export FastAPI OpenAPI and generate TS client (placeholder)
curl -s http://localhost:8080/openapi.json > packages/api-client/openapi.json || true
# Example: use openapi-typescript or openapi-generator here
