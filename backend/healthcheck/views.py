from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
@require_http_methods(["GET"])
def health(request):
    """
    Simple health check endpoint for Railway deployment
    Returns 200 OK to indicate the service is running
    """
    return HttpResponse(
        json.dumps({"status": "ok", "service": "uml-diagrams-backend"}),
        content_type="application/json",
        status=200
    )

@csrf_exempt  
@require_http_methods(["GET"])
def ready(request):
    """
    Readiness check endpoint
    """
    try:
        # Simple check that Django is working
        from django.db import connection
        connection.ensure_connection()
        return HttpResponse(
            json.dumps({"status": "ready"}),
            content_type="application/json", 
            status=200
        )
    except Exception as e:
        return HttpResponse(
            json.dumps({"status": "not ready", "error": str(e)}),
            content_type="application/json",
            status=503
        )