from rest_framework import serializers
from django.db import transaction
from .models import Project, ProjectCollaborator, ProjectSettings
from authentication.serializers import UserSerializer


class ProjectSettingsSerializer(serializers.ModelSerializer):
    """Serializer for project settings"""
    class Meta:
        model = ProjectSettings
        fields = [
            'default_diagram_type', 'auto_save_interval',
            'collaboration_settings', 'export_settings', 'notification_settings'
        ]


class ProjectCollaboratorSerializer(serializers.ModelSerializer):
    """Serializer for project collaborators"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    invited_by = UserSerializer(read_only=True)

    class Meta:
        model = ProjectCollaborator
        fields = [
            'id', 'user', 'user_id', 'role', 'invited_at', 'invited_by',
            'accepted_at', 'is_active'
        ]
        read_only_fields = ['id', 'invited_at', 'invited_by', 'accepted_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model"""
    owner = UserSerializer(read_only=True)
    collaborators = ProjectCollaboratorSerializer(many=True, read_only=True)
    settings = ProjectSettingsSerializer(read_only=True)
    diagrams_count = serializers.SerializerMethodField()
    collaborators_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'visibility',
            'created_at', 'updated_at', 'is_archived',
            'collaborators', 'settings', 'diagrams_count',
            'collaborators_count', 'user_role'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner']

    def get_diagrams_count(self, obj):
        """Get number of diagrams in this project"""
        try:
            return obj.diagrams.count()
        except AttributeError:
            return 0

    def get_collaborators_count(self, obj):
        """Get number of active collaborators"""
        return obj.collaborators.filter(is_active=True).count()

    def get_user_role(self, obj):
        """Get current user's role in this project"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        user = request.user

        # Owner has full access
        if obj.owner == user:
            return 'owner'

        # Check collaborator role
        collaborator = obj.collaborators.filter(
            user=user, is_active=True).first()
        if collaborator:
            return collaborator.role

        # Public projects allow viewing
        if obj.visibility == 'public':
            return 'viewer'

        return None

    def create(self, validated_data):
        """Create project with default settings"""
        request = self.context['request']
        with transaction.atomic():
            project = Project.objects.create(
                owner=request.user,
                **validated_data
            )
            # Default project settings
            ProjectSettings.objects.create(
                project=project,
                collaboration_settings={
                    'allow_comments': True,
                    'auto_save': True,
                    'lock_timeout': 30
                },
                export_settings={
                    'default_format': 'png',
                    'include_metadata': True
                },
                notification_settings={
                    'email_on_invite': True,
                    'email_on_changes': False
                }
            )
        return project


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for project creation"""
    class Meta:
        model = Project
        fields = ['name', 'description', 'visibility']

    def create(self, validated_data):
        """Create project - owner will be set by ViewSet"""
        project = Project.objects.create(**validated_data)
        print("Proyecto creado:", project)
        return project


class ProjectInviteSerializer(serializers.Serializer):
    """
    Serializer for inviting users to project
    """
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectCollaborator.ROLE_CHOICES)
    message = serializers.CharField(
        max_length=500, required=False, allow_blank=True)

    def validate_email(self, value):
        """Validate that user exists"""
        from authentication.models import User
        try:
            User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "User with this email does not exist")
        return value

    def validate(self, attrs):
        """Validate invitation"""
        from authentication.models import User

        project = self.context['project']
        user = User.objects.get(email=attrs['email'])

        # Check if user is already owner
        if project.owner == user:
            raise serializers.ValidationError("Cannot invite project owner")

        # Check if already invited
        existing = ProjectCollaborator.objects.filter(
            project=project,
            user=user
        ).first()

        if existing and existing.is_active:
            raise serializers.ValidationError("User is already a collaborator")

        attrs['user'] = user
        return attrs


class ProjectUpdateRoleSerializer(serializers.Serializer):
    """
    Serializer for updating collaborator role
       """
    role = serializers.ChoiceField(choices=ProjectCollaborator.ROLE_CHOICES)


class ProjectStatsSerializer(serializers.Serializer):
    """
    Serializer for project statistics
    """
    total_diagrams = serializers.IntegerField()
    class_diagrams = serializers.IntegerField()
    database_diagrams = serializers.IntegerField()
    total_elements = serializers.IntegerField()
    total_relationships = serializers.IntegerField()
    active_collaborators = serializers.IntegerField()
    recent_activity = serializers.ListField()

    def to_representation(self, instance):
        """Custom representation for project stats"""
        # This will be implemented in the view
        return super().to_representation(instance)
