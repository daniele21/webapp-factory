FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml /app/
RUN pip install --no-cache-dir uvicorn gunicorn fastapi pydantic pydantic-settings google-cloud-firestore redis fastapi-limiter pyjwt itsdangerous httpx prometheus-client stripe
COPY apps /app/apps
ENV PYTHONPATH=/app
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
