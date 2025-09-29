from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, MaxLengthValidator
import uuid
import json


class Diagram(models.Model):
    """
    Main diagram model - can be class diagram or database diagram
    """
    DIAGRAM_TYPES = [
        ('class', 'Class Diagram'),
        ('database', 'Database Diagram'),
        ('er', 'Entity Relationship Diagram'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)])
    description = models.TextField(blank=True, null=True)
    diagram_type = models.CharField(max_length=20, choices=DIAGRAM_TYPES, default='class')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='diagrams')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_diagrams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='modified_diagrams'
    )
    canvas_data = models.JSONField(default=dict)  # Store canvas positions, zoom level, etc.
    version = models.IntegerField(default=1)
    is_template = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['project', '-updated_at']),
            models.Index(fields=['diagram_type', '-updated_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_diagram_type_display()})"
    
    def get_elements_count(self):
        """Get total number of elements in this diagram"""
        return self.elements.count()
    
    def get_relationships_count(self):
        """Get total number of relationships in this diagram"""
        return self.relationships.count()


class DiagramElement(models.Model):
    """
    Base model for diagram elements (Classes, Database Tables, etc.)
    """
    ELEMENT_TYPES = [
        ('class', 'Class'),
        ('interface', 'Interface'),
        ('abstract_class', 'Abstract Class'),
        ('enum', 'Enumeration'),
        ('table', 'Database Table'),
        ('view', 'Database View'),
        ('package', 'Package'),
        ('note', 'Note'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, validators=[MinLengthValidator(1)])
    element_type = models.CharField(max_length=20, choices=ELEMENT_TYPES)
    diagram = models.ForeignKey(Diagram, on_delete=models.CASCADE, related_name='elements')
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    width = models.FloatField(default=200)
    height = models.FloatField(default=150)
    color = models.CharField(max_length=7, default='#FFFFFF')  # Hex color
    visibility = models.CharField(max_length=20, default='public')
    stereotype = models.CharField(max_length=50, blank=True, null=True)
    documentation = models.TextField(blank=True, null=True)
    properties = models.JSONField(default=dict)  # Additional properties
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['diagram', 'name']
        indexes = [
            models.Index(fields=['diagram', 'element_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_element_type_display()})"


class ElementAttribute(models.Model):
    """
    Attributes/Properties of diagram elements (class fields, table columns)
    """
    VISIBILITY_CHOICES = [
        ('+', 'Public'),
        ('-', 'Private'),
        ('#', 'Protected'),
        ('~', 'Package'),
    ]
    
    DATA_TYPES = [
        # Programming types
        ('string', 'String'),
        ('int', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('date', 'Date'),
        ('datetime', 'DateTime'),
        ('list', 'List'),
        ('dict', 'Dictionary'),
        ('object', 'Object'),
        # Database types
        ('varchar', 'VARCHAR'),
        ('text', 'TEXT'),
        ('integer', 'INTEGER'),
        ('bigint', 'BIGINT'),
        ('decimal', 'DECIMAL'),
        ('float', 'FLOAT'),
        ('double', 'DOUBLE'),
        ('boolean', 'BOOLEAN'),
        ('date', 'DATE'),
        ('timestamp', 'TIMESTAMP'),
        ('json', 'JSON'),
        ('uuid', 'UUID'),
    ]
    
    element = models.ForeignKey(DiagramElement, on_delete=models.CASCADE, related_name='attributes')
    name = models.CharField(max_length=100)
    data_type = models.CharField(max_length=50, choices=DATA_TYPES, default='string')
    visibility = models.CharField(max_length=1, choices=VISIBILITY_CHOICES, default='+')
    is_static = models.BooleanField(default=False)
    is_final = models.BooleanField(default=False)
    is_abstract = models.BooleanField(default=False)
    default_value = models.CharField(max_length=200, blank=True, null=True)
    constraints = models.JSONField(default=dict)  # For DB: nullable, unique, primary_key, etc.
    order = models.IntegerField(default=0)
    documentation = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['order', 'name']
        unique_together = ['element', 'name']
    
    def __str__(self):
        return f"{self.element.name}.{self.name}: {self.data_type}"


class ElementMethod(models.Model):
    """
    Methods/Operations of diagram elements (for classes)
    """
    VISIBILITY_CHOICES = [
        ('+', 'Public'),
        ('-', 'Private'),
        ('#', 'Protected'),
        ('~', 'Package'),
    ]
    
    element = models.ForeignKey(DiagramElement, on_delete=models.CASCADE, related_name='methods')
    name = models.CharField(max_length=100)
    return_type = models.CharField(max_length=50, default='void')
    visibility = models.CharField(max_length=1, choices=VISIBILITY_CHOICES, default='+')
    is_static = models.BooleanField(default=False)
    is_final = models.BooleanField(default=False)
    is_abstract = models.BooleanField(default=False)
    is_constructor = models.BooleanField(default=False)
    parameters = models.JSONField(default=list)  # [{name, type, default}, ...]
    order = models.IntegerField(default=0)
    documentation = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.element.name}.{self.name}(): {self.return_type}"
    
    def get_signature(self):
        """Get method signature as string"""
        params = ', '.join([f"{p.get('name', '')}: {p.get('type', '')}" for p in self.parameters])
        return f"{self.name}({params}): {self.return_type}"


class DiagramRelationship(models.Model):
    """
    Relationships between diagram elements
    """
    RELATIONSHIP_TYPES = [
        # Class diagram relationships
        ('inheritance', 'Inheritance (is-a)'),
        ('realization', 'Realization (implements)'),
        ('composition', 'Composition (strong has-a)'),
        ('aggregation', 'Aggregation (weak has-a)'),
        ('association', 'Association'),
        ('dependency', 'Dependency (uses)'),
        # Database relationships  
        ('one_to_one', 'One to One'),
        ('one_to_many', 'One to Many'),
        ('many_to_many', 'Many to Many'),
        ('foreign_key', 'Foreign Key'),
    ]
    
    MULTIPLICITY_CHOICES = [
        ('0', '0'),
        ('1', '1'),
        ('0..1', '0..1'),
        ('1..1', '1..1'),
        ('0..*', '0..*'),
        ('1..*', '1..*'),
        ('*', '*'),
        ('n', 'n'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagram = models.ForeignKey(Diagram, on_delete=models.CASCADE, related_name='relationships')
    source_element = models.ForeignKey(
        DiagramElement, 
        on_delete=models.CASCADE, 
        related_name='outgoing_relationships'
    )
    target_element = models.ForeignKey(
        DiagramElement, 
        on_delete=models.CASCADE, 
        related_name='incoming_relationships'
    )
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPES)
    name = models.CharField(max_length=100, blank=True, null=True)  # Relationship name/label
    source_multiplicity = models.CharField(max_length=10, choices=MULTIPLICITY_CHOICES, blank=True, null=True)
    target_multiplicity = models.CharField(max_length=10, choices=MULTIPLICITY_CHOICES, blank=True, null=True)
    source_role = models.CharField(max_length=50, blank=True, null=True)
    target_role = models.CharField(max_length=50, blank=True, null=True)
    is_navigable = models.BooleanField(default=True)
    line_style = models.CharField(max_length=20, default='solid')  # solid, dashed, dotted
    color = models.CharField(max_length=7, default='#000000')  # Hex color
    waypoints = models.JSONField(default=list)  # For custom line routing
    properties = models.JSONField(default=dict)  # Additional properties
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['diagram', 'relationship_type']),
            models.Index(fields=['source_element']),
            models.Index(fields=['target_element']),
        ]
    
    def __str__(self):
        return f"{self.source_element.name} → {self.target_element.name} ({self.get_relationship_type_display()})"
    
    def get_multiplicity_label(self):
        """Get formatted multiplicity label"""
        source = self.source_multiplicity or ''
        target = self.target_multiplicity or ''
        return f"{source} → {target}" if source or target else ''


class DiagramVersion(models.Model):
    """
    Version history for diagrams
    """
    diagram = models.ForeignKey(Diagram, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    changes_summary = models.TextField(blank=True, null=True)
    snapshot_data = models.JSONField()  # Complete diagram state
    
    class Meta:
        unique_together = ['diagram', 'version_number']
        ordering = ['-version_number']
    
    def __str__(self):
        return f"{self.diagram.name} v{self.version_number}"
