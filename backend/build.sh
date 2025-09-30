#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting Render build process..."

# Upgrade pip and install essential packages first
python -m pip install --upgrade pip setuptools wheel

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "📁 Creating necessary directories..."
mkdir -p staticfiles
mkdir -p media

echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --clear

echo "🗄️ Running database migrations..."
python manage.py migrate --no-input

echo "✅ Build completed successfully!"