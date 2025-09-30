#!/usr/bin/env bash
# Render deployment script
# exit on error
set -o errexit

echo "🚀 Starting Render deployment..."

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p staticfiles
mkdir -p media

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --clear

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --no-input

echo "✅ Render deployment completed successfully!"