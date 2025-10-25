#!/usr/bin/env bash
set -euo pipefail

# Dev runner for frontend (apps/web) and backend (apps/api).
# Usage: dev.sh         # run both
#        dev.sh web     # run only web
#        dev.sh api     # run only api

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_web() {
  echo "Starting web (apps/web)..."
  cd "$REPO_ROOT/apps/web"
  # start the Vite dev server
  pnpm dev &
  PID_WEB=$!
  echo "web pid=$PID_WEB"
  cd "$REPO_ROOT" || true
}

run_api() {
  echo "Starting api (apps/api)..."
  cd "$REPO_ROOT/apps/api"
  # Ensure Python imports find the inner 'apps' package by setting PYTHONPATH to current dir
  PYTHONPATH=. uvicorn apps.api.main:app --reload --host 0.0.0.0 --port 8080 &
  PID_API=$!
  echo "api pid=$PID_API"
  cd "$REPO_ROOT" || true
}

cleanup() {
  echo "Shutting down..."
  set +e
  [ -n "${PID_WEB-}" ] && kill "$PID_WEB" 2>/dev/null || true
  [ -n "${PID_API-}" ] && kill "$PID_API" 2>/dev/null || true
  wait
}

trap cleanup EXIT INT TERM

case "${1-}" in
  web)
    run_web
    ;;
  api)
    run_api
    ;;
  "" )
    run_api
    run_web
    ;;
  *)
    echo "Unknown target: $1" >&2
    echo "Usage: $0 [web|api]" >&2
    exit 2
    ;;
esac

wait
