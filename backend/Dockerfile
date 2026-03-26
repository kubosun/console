FROM python:3.12-slim AS deps

WORKDIR /app
COPY pyproject.toml ./

# Install dependencies into a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir .

# --- Runner ---
FROM python:3.12-slim AS runner

WORKDIR /app

# Copy virtualenv from deps stage
COPY --from=deps /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code only
COPY app ./app

# Non-root user
RUN addgroup --system --gid 1001 kubosun && \
    adduser --system --uid 1001 --ingroup kubosun kubosun
USER kubosun

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
