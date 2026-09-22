FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=1 \
  PORT=8000

WORKDIR /app

# System dependencies required by PostgreSQL/Python packages
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  gcc \
  libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for Docker layer caching
COPY requirements.txt .

RUN pip install --upgrade pip \
  && pip install -r requirements.txt

# Copy application
COPY . .

# Collect static files during image build
RUN python manage.py collectstatic --noinput

# Render provides the PORT environment variable
EXPOSE 8000

# Production server — migrate + seed plans then start
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_billing && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 3 --timeout 60"]