from django.db import models
from django.conf import settings
import uuid
from django.core.validators import MinLengthValidator


class CodeGenerationTemplate(models.Model):
    """
    Templates for code generation
    """
    TEMPLATE_TYPES = [
        ('spring_boot', 'Spring Boot'),
        ('django', 'Django'),
        ('nodejs', 'Node.js'),
        ('dotnet', '.NET Core'),
        ('laravel', 'Laravel'),
        ('database', 'Database Schema'),
    ]
    
    LANGUAGE_CHOICES = [
        ('java', 'Java'),
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('typescript', 'TypeScript'),
        ('csharp', 'C#'),
        ('php', 'PHP'),
        ('sql', 'SQL'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)])
    description = models.TextField(blank=True, null=True)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    version = models.CharField(max_length=20, default='1.0')  # Framework/language version
    template_content = models.JSONField()  # Template definitions
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['template_type', 'name']
        indexes = [
            models.Index(fields=['template_type', 'language']),
            models.Index(fields=['is_default', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()} - {self.get_language_display()})"


class CodeGenerationJob(models.Model):
    """
    Code generation job tracking
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    OUTPUT_FORMATS = [
        ('zip', 'ZIP Archive'),
        ('tar', 'TAR Archive'),
        ('folder', 'Folder Structure'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, related_name='generation_jobs')
    template = models.ForeignKey(CodeGenerationTemplate, on_delete=models.CASCADE, related_name='generation_jobs')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generation_jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    output_format = models.CharField(max_length=10, choices=OUTPUT_FORMATS, default='zip')
    configuration = models.JSONField(default=dict)  # Generation configuration options
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    output_file = models.FileField(upload_to='generated_code/', blank=True, null=True)
    output_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['requested_by', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['diagram', '-created_at']),
        ]
    
    def __str__(self):
        return f"Generation job for {self.diagram.name} using {self.template.name}"
    
    def get_duration(self):
        """Get job duration if completed"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None


class GeneratedFile(models.Model):
    """
    Individual files generated during code generation
    """
    FILE_TYPES = [
        ('entity', 'Entity/Model'),
        ('repository', 'Repository'),
        ('service', 'Service'),
        ('controller', 'Controller'),
        ('config', 'Configuration'),
        ('test', 'Test File'),
        ('migration', 'Database Migration'),
        ('schema', 'Database Schema'),
        ('documentation', 'Documentation'),
        ('other', 'Other'),
    ]
    
    generation_job = models.ForeignKey(CodeGenerationJob, on_delete=models.CASCADE, related_name='generated_files')
    file_path = models.CharField(max_length=500)  # Relative path within the generated project
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='other')
    content = models.TextField()  # File content
    size = models.IntegerField()  # File size in bytes
    based_on_element = models.ForeignKey(
        'diagrams.DiagramElement', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='generated_files'
    )
    
    class Meta:
        ordering = ['file_path', 'file_name']
        indexes = [
            models.Index(fields=['generation_job', 'file_type']),
        ]
    
    def __str__(self):
        return f"{self.file_path}/{self.file_name}"


class DatabaseSchema(models.Model):
    """
    Generated database schema information
    """
    DATABASE_TYPES = [
        ('postgresql', 'PostgreSQL'),
        ('mysql', 'MySQL'),
        ('sqlite', 'SQLite'),
        ('oracle', 'Oracle'),
        ('sqlserver', 'SQL Server'),
        ('mongodb', 'MongoDB'),
    ]
    
    generation_job = models.ForeignKey(CodeGenerationJob, on_delete=models.CASCADE, related_name='database_schemas')
    database_type = models.CharField(max_length=20, choices=DATABASE_TYPES)
    schema_name = models.CharField(max_length=100, blank=True, null=True)
    ddl_script = models.TextField()  # Data Definition Language script
    migration_scripts = models.JSONField(default=list)  # List of migration scripts
    indexes = models.JSONField(default=list)  # Index definitions
    constraints = models.JSONField(default=list)  # Constraint definitions
    
    def __str__(self):
        return f"{self.get_database_type_display()} schema for {self.generation_job.diagram.name}"


class CodeGenerationHistory(models.Model):
    """
    History of code generation for diagrams
    """
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, related_name='generation_history')
    generation_job = models.ForeignKey(CodeGenerationJob, on_delete=models.CASCADE, related_name='history_entries')
    diagram_version = models.IntegerField()  # Version of diagram when generated
    generated_at = models.DateTimeField()
    files_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)  # Total size in bytes
    download_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"Generation history for {self.diagram.name} v{self.diagram_version}"
