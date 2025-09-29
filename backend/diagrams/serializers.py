from rest_framework import serializers
from .models import (
    Diagram,
    DiagramElement,
    ElementAttribute,
    ElementMethod,
    DiagramRelationship,
    DiagramVersion
)

class DiagramSerializer(serializers.ModelSerializer):
#     *** Ejemplo de uso con Postman para crear un diagrama ***
#     POST http://localhost:8000/api/diagrams/
# Headers:
#   Authorization: Token <tu_token>
#   Content-Type: application/json

# Body (JSON):
# {
#   "name": "MiDiagrama",
#   "description": "Diagrama para generar backend",
#   "diagram_type": "class",
#   "project": "<PROJECT_UUID>",
#   "canvas_data": {}
# } ***
    
    
    # Campos de solo lectura
    created_by = serializers.StringRelatedField(read_only=True)
    last_modified_by = serializers.StringRelatedField(read_only=True)
    elements_count = serializers.SerializerMethodField()
    relationships_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Diagram
        fields = [
            'id', 'name', 'description', 'diagram_type', 'project', 'created_by',
            'created_at', 'updated_at', 'last_modified_by', 'canvas_data',
            'version', 'is_template', 'elements_count', 'relationships_count'
        ]
        read_only_fields = ['created_by', 'last_modified_by', 'created_at', 'updated_at', 'version']
    
    def get_elements_count(self, obj):
        return obj.get_elements_count()
    
    def get_relationships_count(self, obj):
        return obj.get_relationships_count()

class ElementAttributeSerializer(serializers.ModelSerializer):
    
#     POST http://localhost:8000/api/element-attributes/
# Headers:
#   Authorization: Token <tu_token>
#   Content-Type: application/json

# Body (JSON):
# {
#   "element": "<ELEMENT_ID>",
#   "name": "id",
#   "data_type": "int",
#   "visibility": "+",
#   "is_static": false,
#   "is_final": false,
#   "default_value": null,
#   "constraints": {"primary_key": true, "nullable": false},
#   "order": 0
# }
# POST http://localhost:8000/api/element-attributes/
# Headers:
#   Authorization: Token <tu_token>
#   Content-Type: application/json

# Body (JSON):
# {
#   "element": "<ELEMENT_ID>",
#   "name": "nombre",
#   "data_type": "string",
#   "visibility": "+",
#   "constraints": {"nullable": false},
#   "order": 1
# }
    class Meta:
        model = ElementAttribute
        fields = [
            'id', 'element', 'name', 'data_type', 'visibility', 'is_static',
            'is_final', 'is_abstract', 'default_value', 'constraints', 'order',
            'documentation'
        ]
    
    def validate_name(self, value):
        """Validar que el nombre del atributo no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError("El nombre del atributo no puede estar vacío")
        return value

class ElementMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElementMethod
        fields = [
            'id', 'element', 'name', 'return_type', 'visibility', 'is_static',
            'is_final', 'is_abstract', 'is_constructor', 'parameters', 'order',
            'documentation'
        ]
    
    def validate_name(self, value):
        """Validar que el nombre del método no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError("El nombre del método no puede estar vacío")
        return value

class DiagramElementSerializer(serializers.ModelSerializer):
    
#     POST http://localhost:8000/api/diagram-elements/
# Headers:
#   Authorization: Token <tu_token>
#   Content-Type: application/json

# Body (JSON):
# {
#   "diagram": "<DIAGRAM_ID>",
#   "name": "tabla2",
#   "element_type": "class",
#   "position_x": 100,
#   "position_y": 100
# }
    # Incluir atributos y métodos anidados
    attributes = ElementAttributeSerializer(many=True, read_only=True)
    methods = ElementMethodSerializer(many=True, read_only=True)
    
    class Meta:
        model = DiagramElement
        fields = [
            'id', 'name', 'element_type', 'diagram', 'position_x', 'position_y',
            'width', 'height', 'color', 'visibility', 'stereotype', 'documentation',
            'properties', 'created_at', 'updated_at', 'attributes', 'methods'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_position_x(self, value):
        """Validar que la posición X sea válida"""
        if value < 0:
            raise serializers.ValidationError("La posición X no puede ser negativa")
        return value
    
    def validate_position_y(self, value):
        """Validar que la posición Y sea válida"""
        if value < 0:
            raise serializers.ValidationError("La posición Y no puede ser negativa")
        return value

class DiagramRelationshipSerializer(serializers.ModelSerializer):
    source_element_name = serializers.CharField(source='source_element.name', read_only=True)
    target_element_name = serializers.CharField(source='target_element.name', read_only=True)
    
    class Meta:
        model = DiagramRelationship
        fields = [
            'id', 'diagram', 'source_element', 'target_element', 'relationship_type',
            'name', 'source_multiplicity', 'target_multiplicity', 'source_role',
            'target_role', 'is_navigable', 'line_style', 'color', 'waypoints',
            'properties', 'created_at', 'source_element_name', 'target_element_name'
        ]
        read_only_fields = ['created_at']
    
    def validate(self, data):
        """Validar que los elementos no sean el mismo"""
        if data.get('source_element') == data.get('target_element'):
            raise serializers.ValidationError("Un elemento no puede tener una relación consigo mismo")
        return data

class DiagramVersionSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = DiagramVersion
        fields = [
            'id', 'diagram', 'version_number', 'created_by', 'created_at',
            'changes_summary', 'snapshot_data'
        ]
        read_only_fields = ['created_by', 'created_at']

# Serializador simplificado para listados
class DiagramListSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    elements_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Diagram
        fields = [
            'id', 'name', 'description', 'diagram_type', 'created_by',
            'created_at', 'updated_at', 'version', 'is_template', 'elements_count'
        ]
    
    def get_elements_count(self, obj):
        return obj.elements.count()