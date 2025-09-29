from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AuthViewSet, UserViewSet, CustomTokenObtainPairView
from .oauth_views import google_login_callback, google_oauth_url

# Create router for ViewSets
router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet)

app_name = 'authentication'

urlpatterns = [
    # Include ViewSet URLs
    path('', include(router.urls)),
    
    # JWT token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Google OAuth endpoints
    path('auth/google/', google_login_callback, name='google_login'),
    path('auth/google/url/', google_oauth_url, name='google_oauth_url'),
    
      # 🔥 NUEVO: Agregar esta línea para el registro
    # path('auth/register/', AuthViewSet.as_view({'post': 'register'}), name='auth-register'),
    # path('auth/login/', AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
    # path('auth/profile/', AuthViewSet.as_view({'get': 'login'}), name='auth-get'),
    
    
]
# para ver las rutas que se han creado  
# # python manage.py show_urls
# http://localhost:8000/api/

# URL patterns generated:
# Authentication
# GET    /api/auth/profile/              - Get current user profile
# POST   /api/auth/register/             - Register new user
# POST   /api/auth/login/                - Login user
# POST   /api/auth/logout/               - Logout user
# PUT    /api/auth/update_profile/       - Update user profile  
# PATCH  /api/auth/update_profile/       - Partial update user profile
# POST   /api/auth/change_password/      - Change password
#
# Password Reset
# POST   /api/auth/password_reset_request/    - Request password reset
# POST   /api/auth/password_reset_confirm/    - Confirm password reset
#
# Email Verification  
# POST   /api/auth/verify_email/              - Verify email with token
# POST   /api/auth/resend_email_verification/ - Resend verification email
#
# Users
# GET    /api/users/                     - List users (with filters)
# GET    /api/users/{id}/                - Get specific user
#
# JWT Tokens
# POST   /api/token/                     - Get JWT tokens
# POST   /api/token/refresh/             - Refresh JWT token
#
# Google OAuth
# POST   /api/auth/google/               - Google OAuth login
# GET    /api/auth/google/url/           - Get Google OAuth URL
