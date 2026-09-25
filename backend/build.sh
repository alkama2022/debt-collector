#!/usr/bin/env bash
# Render build step. Referenced by render.yaml buildCommand.
set -euo pipefail

pip install --upgrade pip
pip install -r requirements.txt

# Static assets. The API is JSON-only, so failures here are not fatal.
python manage.py collectstatic --noinput || echo "collectstatic skipped"

echo "Build complete."
