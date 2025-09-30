#!/usr/bin/env bash
# Render build script - exit on any error
set -e

echo "=== Starting Render Build Process ==="
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"

# Upgrade pip and install essential packages
echo "=== Upgrading pip and installing build tools ==="
python -m pip install --upgrade pip
pip install setuptools wheel

# Install dependencies with verbose output
echo "=== Installing project dependencies ==="
pip install -r requirements.txt --verbose

# Create necessary directories
echo "=== Creating directories ==="
mkdir -p staticfiles media

# Set Django settings
export DJANGO_SETTINGS_MODULE=uml_diagrams_backend.settings_render
echo "Using Django settings: $DJANGO_SETTINGS_MODULE"

# Collect static files with settings check
echo "=== Testing Django configuration ==="
python manage.py check --deploy

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput --clear

# Run migrations
echo "=== Running database migrations ==="
python manage.py migrate --noinput

echo "=== Build completed successfully! ==="