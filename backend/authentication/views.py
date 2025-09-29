from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import logout
from django.db import models
from .models import User
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    PasswordChangeSerializer, UserUpdateSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer, ResendEmailVerificationSerializer
)


class AuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for authentication operations
    """
    
    
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """
        Register a new user
        
        POST /api/auth/register/
        Body: {
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe", 
            "password": "securepassword123",
            "password_confirm": "securepassword123"
        }
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            # Return user data with tokens
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """
        Login user and return JWT tokens
        
        POST /api/auth/login/
        Body: {
            "email": "user@example.com",
            "password": "password123"
        }
        """
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """
        Logout user and blacklist refresh token
        
        POST /api/auth/logout/
        Body: {
            "refresh": "refresh_token_here"
        }
        """
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logout(request)
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """
        Get current user profile
        
        GET /api/auth/profile/
        """
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """
        Update current user profile
        
        PUT/PATCH /api/auth/update_profile/
        Body: {
            "first_name": "John",
            "last_name": "Smith",
            "profile": {
                "bio": "Software developer",
                "location": "New York"
            }
        }
        """
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=request.method == 'PATCH'
        )
        
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_request(self, request):
        """
        Request password reset token
        
        POST /api/auth/password_reset_request/
        Body: {
            "email": "user@example.com"
        }
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.save()
            return Response({
                'message': 'Password reset email sent successfully. Check your email for reset instructions.',
                'token_id': token.id  # Only for development/testing
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_confirm(self, request):
        """
        Confirm password reset with token
        
        POST /api/auth/password_reset_confirm/
        Body: {
            "token": "password_reset_token_here",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123"
        }
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Password has been reset successfully. You can now login with your new password.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def verify_email(self, request):
        """
        Verify email with token
        
        POST /api/auth/verify_email/
        Body: {
            "token": "email_verification_token_here"
        }
        """
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Email verified successfully!',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def resend_email_verification(self, request):
        """
        Resend email verification
        
        POST /api/auth/resend_email_verification/
        Body: {
            "email": "user@example.com"
        }
        """
        serializer = ResendEmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.save()
            return Response({
                'message': 'Verification email sent successfully. Check your email.',
                'token_id': token.id  # Only for development/testing
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """
        Change user password
        
        POST /api/auth/change_password/
        Body: {
            "old_password": "oldpass123",
            "new_password": "newpass123",
            "new_password_confirm": "newpass123"
        }
        """
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Set new password
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user operations (read-only for other users)
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter users based on query parameters
        """
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by name or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(email__icontains=search)
            )
        
        return queryset


# Custom JWT token view to include user data
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user data in response
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user from email
            email = request.data.get('email')
            user = User.objects.get(email=email)
            
            # Add user data to response
            response.data['user'] = UserSerializer(user).data
            response.data['message'] = 'Login successful'
        
        return response
