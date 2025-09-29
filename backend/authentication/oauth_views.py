from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserProfile
from .serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_callback(request):
    """
    Handle Google OAuth callback
    
    POST /api/auth/google/
    Body: {
        "access_token": "google_access_token_here"
    }
    """
    try:
        access_token = request.data.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Access token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token with Google and get user info
        import requests
        google_user_info_url = f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}'
        google_response = requests.get(google_user_info_url)
        
        if google_response.status_code != 200:
            return Response(
                {'error': 'Invalid Google access token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_user_data = google_response.json()
        email = google_user_data.get('email')
        
        if not email:
            return Response(
                {'error': 'Could not get email from Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user from Google data
            user = User.objects.create_user(
                email=email,
                first_name=google_user_data.get('given_name', ''),
                last_name=google_user_data.get('family_name', ''),
                is_email_verified=True  # Google emails are verified
            )
            
            # Create user profile
            UserProfile.objects.create(user=user)
        
        # Ensure email is verified for existing users too
        if not user.is_email_verified:
            user.is_email_verified = True
            user.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Google login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Google login failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def google_oauth_url(request):
    """
    Get Google OAuth URL for frontend
    
    GET /api/auth/google/url/
    """
    from urllib.parse import urlencode
    from django.conf import settings
    
    # Get Google OAuth settings
    google_settings = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    client_id = google_settings.get('APP', {}).get('client_id', '')
    
    if not client_id:
        return Response(
            {'error': 'Google OAuth not configured'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Build OAuth URL
    oauth_url = 'https://accounts.google.com/o/oauth2/auth?' + urlencode({
        'client_id': client_id,
        'redirect_uri': 'http://localhost:3000/auth/google/callback',
        'scope': 'openid email profile',
        'response_type': 'code',
        'access_type': 'offline',
        'prompt': 'consent'
    })
    
    return Response({
        'oauth_url': oauth_url,
        'client_id': client_id
    })
