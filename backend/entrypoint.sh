#!/usr/bin/env bash
set -e

echo "🚂 Railway Deployment - Starting UML Diagrams Backend"

echo ">>> Waiting for database connection..."
sleep 5

echo ">>> Running database migrations..."
python manage.py migrate --noinput || {
    echo "❌ Migration failed, but continuing..."
}

echo ">>> Creating superuser if needed..."
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Superuser created: admin/admin123")
else:
    print("ℹ️  Superuser already exists")
EOF

echo ">>> Collecting static files..."
python manage.py collectstatic --noinput --clear || {
    echo "❌ Static files collection failed, but continuing..."
}

echo ">>> Starting Gunicorn server..."
exec gunicorn uml_diagrams_backend.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 3 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    --log-level info