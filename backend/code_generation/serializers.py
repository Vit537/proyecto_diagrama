from rest_framework import serializers
from .models import (
    CodeGenerationTemplate, CodeGenerationJob, GeneratedFile,
    DatabaseSchema, CodeGenerationHistory
)


class CodeGenerationTemplateSerializer(serializers.ModelSerializer):
    
#     {
# "diagram_id": "07fd2cba-240e-44f2-b00e-6b39a08b3a95",
# "template_type": "spring_boot",
# "language": "java",
# "output_format": "zip",
# "package_name": "com.example",
# "project_name": "my-project",
# "spring_boot_version": "3.2.0",
# "java_version": "17",
# "include_tests": true,
# "include_swagger": true
# }
    """Serializer for CodeGenerationTemplate model"""
    
    class Meta:
        model = CodeGenerationTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'language',
            'version', 'template_content', 'is_default', 'is_active',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class GeneratedFileSerializer(serializers.ModelSerializer):
    """Serializer for GeneratedFile model"""
    
    class Meta:
        model = GeneratedFile
        fields = [
            'file_path', 'file_name', 'file_type', 'content', 'size',
            'based_on_element'
        ]


class DatabaseSchemaSerializer(serializers.ModelSerializer):
    """Serializer for DatabaseSchema model"""
    
    class Meta:
        model = DatabaseSchema
        fields = [
            'database_type', 'schema_name', 'ddl_script',
            'migration_scripts', 'indexes', 'constraints'
        ]


class CodeGenerationJobSerializer(serializers.ModelSerializer):
    """Serializer for CodeGenerationJob model"""
    generated_files = GeneratedFileSerializer(many=True, read_only=True)
    database_schemas = DatabaseSchemaSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    diagram_name = serializers.CharField(source='diagram.name', read_only=True)
    
    class Meta:
        model = CodeGenerationJob
        fields = [
            'id', 'diagram', 'template', 'template_name', 'diagram_name',
            'status', 'output_format', 'configuration', 'created_at',
            'started_at', 'completed_at', 'error_message', 'output_file',
            'output_size', 'generated_files', 'database_schemas'
        ]
        read_only_fields = [
            'id', 'requested_by', 'status', 'started_at', 'completed_at',
            'error_message', 'output_file', 'output_size'
        ]


class CodeGenerationJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating code generation jobs"""
    
    class Meta:
        model = CodeGenerationJob
        fields = ['diagram', 'template', 'output_format', 'configuration']

    def validate_diagram(self, value):
        """Validate that user has access to the diagram"""
        request = self.context.get('request')
        if not value.project.has_permission(request.user, 'view'):
            raise serializers.ValidationError(
                "You don't have permission to generate code for this diagram."
            )
        return value


class CodeGenerationHistorySerializer(serializers.ModelSerializer):
    """Serializer for CodeGenerationHistory model"""
    template_name = serializers.CharField(source='generation_job.template.name', read_only=True)
    template_type = serializers.CharField(source='generation_job.template.template_type', read_only=True)
    
    class Meta:
        model = CodeGenerationHistory
        fields = [
            'id', 'diagram', 'generation_job', 'diagram_version',
            'generated_at', 'files_count', 'total_size', 'download_count',
            'template_name', 'template_type'
        ]


class CodeGenerationRequestSerializer(serializers.Serializer):
    """Serializer for code generation requests"""
    diagram_id = serializers.UUIDField()
    template_type = serializers.ChoiceField(choices=CodeGenerationTemplate.TEMPLATE_TYPES)
    language = serializers.ChoiceField(choices=CodeGenerationTemplate.LANGUAGE_CHOICES)
    database_type = serializers.ChoiceField(
        choices=DatabaseSchema.DATABASE_TYPES,
        required=False
    )
    output_format = serializers.ChoiceField(
        choices=CodeGenerationJob.OUTPUT_FORMATS,
        default='zip'
    )
    configuration = serializers.JSONField(default=dict)
    
    # Spring Boot specific options
    package_name = serializers.CharField(
        max_length=255,
        default='com.example.app',
        required=False
    )
    project_name = serializers.CharField(
        max_length=255,
        default='generated-app',
        required=False
    )
    spring_boot_version = serializers.CharField(
        max_length=20,
        default='3.2.0',
        required=False
    )
    java_version = serializers.CharField(
        max_length=10,
        default='17',
        required=False
    )
    include_tests = serializers.BooleanField(default=True)
    include_swagger = serializers.BooleanField(default=True)
    include_security = serializers.BooleanField(default=False)
    
    def validate_diagram_id(self, value):
        """Validate that the diagram exists and user has access"""
        from diagrams.models import Diagram
        
        request = self.context.get('request')
        try:
            diagram = Diagram.objects.get(id=value)
            if not diagram.project.has_permission(request.user, 'view'):
                raise serializers.ValidationError(
                    "You don't have permission to access this diagram."
                )
            return value
        except Diagram.DoesNotExist:
            raise serializers.ValidationError("Diagram not found.")


class DatabaseScriptGenerationSerializer(serializers.Serializer):
    """Serializer for database script generation"""
    diagram_id = serializers.UUIDField()
    database_types = serializers.MultipleChoiceField(
        choices=DatabaseSchema.DATABASE_TYPES,
        default=['postgresql']
    )
    include_constraints = serializers.BooleanField(default=True)
    include_indexes = serializers.BooleanField(default=True)
    include_sample_data = serializers.BooleanField(default=False)
    schema_name = serializers.CharField(max_length=100, required=False)
    
    def validate_diagram_id(self, value):
        """Validate that the diagram exists and user has access"""
        from diagrams.models import Diagram
        
        request = self.context.get('request')
        try:
            diagram = Diagram.objects.get(id=value)
            if not diagram.project.has_permission(request.user, 'view'):
                raise serializers.ValidationError(
                    "You don't have permission to access this diagram."
                )
            # Validate that it's a database diagram
            if diagram.diagram_type not in ['database', 'er']:
                raise serializers.ValidationError(
                    "This endpoint only supports database and ER diagrams."
                )
            return value
        except Diagram.DoesNotExist:
            raise serializers.ValidationError("Diagram not found.")
