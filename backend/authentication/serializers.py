from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile, PasswordResetToken, EmailVerificationToken


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information
    """
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'location', 'organization', 'website', 
            'timezone', 'notification_preferences'
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for responses
    """
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'role', 'is_email_verified', 'created_at', 
            'updated_at', 'is_active', 'profile'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_email_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        """
        Create user and profile
        """
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        """
        Validate and authenticate user
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(style={'input_type': 'password'})
    new_password = serializers.CharField(
        style={'input_type': 'password'}, 
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        """
        Validate password change data
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        """
        Validate old password
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Incorrect old password')
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information
    """
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'avatar', 'profile']
    
    def update(self, instance, validated_data):
        """
        Update user and profile information
        """
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile if provided
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate that user exists"""
        try:
            User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")
        return value
    
    def save(self):
        """Create password reset token and send email"""
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        
        # Create password reset token
        token = PasswordResetToken.objects.create(user=user)
        
        # Send email (simplified for development)
        reset_url = f"http://localhost:3000/reset-password?token={token.token}"
        
        try:
            send_mail(
                subject='Password Reset - UML Diagrams',
                message=f"""Hi {user.first_name},
                
You requested a password reset. Click the link below to reset your password:
                
{reset_url}
                
This link will expire in 1 hour.
                
If you didn't request this, please ignore this email.
                
Best regards,
UML Diagrams Team""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # In development, we can just log the token
            print(f"Password reset token for {email}: {token.token}")
            print(f"Reset URL: {reset_url}")
        
        return token


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming password reset
    """
    token = serializers.CharField()
    new_password = serializers.CharField(
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        """Validate password reset data"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Validate token
        token = attrs.get('token')
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if not reset_token.is_valid():
                raise serializers.ValidationError("Invalid or expired token")
            attrs['reset_token'] = reset_token
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        
        return attrs
    
    def save(self):
        """Reset user password"""
        reset_token = self.validated_data['reset_token']
        new_password = self.validated_data['new_password']
        
        # Update user password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.use_token()
        
        return user


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification
    """
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate email verification token"""
        try:
            verification_token = EmailVerificationToken.objects.get(token=value)
            if not verification_token.is_valid():
                raise serializers.ValidationError("Invalid or expired token")
            return verification_token
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
    
    def save(self):
        """Verify user email"""
        verification_token = self.validated_data['token']
        verification_token.use_token()
        return verification_token.user


class ResendEmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for resending email verification
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate user exists and email not already verified"""
        try:
            user = User.objects.get(email=value, is_active=True)
            if user.is_email_verified:
                raise serializers.ValidationError("Email is already verified")
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")
    
    def save(self):
        """Create new verification token and send email"""
        user = self.validated_data['email']
        
        # Create email verification token
        token = EmailVerificationToken.objects.create(user=user)
        
        # Send verification email
        verification_url = f"http://localhost:3000/verify-email?token={token.token}"
        
        try:
            send_mail(
                subject='Email Verification - UML Diagrams',
                message=f"""Hi {user.first_name},
                
Please verify your email address by clicking the link below:
                
{verification_url}
                
This link will expire in 24 hours.
                
Best regards,
UML Diagrams Team""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # In development, log the token
            print(f"Email verification token for {user.email}: {token.token}")
            print(f"Verification URL: {verification_url}")
        
        return token
