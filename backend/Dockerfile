FROM python:3.12-slim

WORKDIR /app

# Install uv for fast package management
RUN pip install uv

COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml 2>/dev/null || pip install fastapi uvicorn[standard] sqlmodel psycopg2-binary pydantic python-dotenv authlib httpx python-jose[cryptography]

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
