from rest_framework.routers import DefaultRouter
from .views import (
    DiagramViewSet,
    DiagramElementViewSet,
    ElementAttributeViewSet,
    ElementMethodViewSet,
    DiagramRelationshipViewSet,
    DiagramVersionViewSet
)

# Crear un router para registrar los ViewSets
router = DefaultRouter()
router.register(r'diagrams', DiagramViewSet, basename='diagram')
router.register(r'diagram-elements', DiagramElementViewSet, basename='diagram-element')
router.register(r'element-attributes', ElementAttributeViewSet, basename='element-attribute')
router.register(r'element-methods', ElementMethodViewSet, basename='element-method')
router.register(r'diagram-relationships', DiagramRelationshipViewSet, basename='diagram-relationship')
router.register(r'diagram-versions', DiagramVersionViewSet, basename='diagram-version')

# Exportar las URLs generadas por el router
urlpatterns = router.urls

# Claro, aquí tienes las rutas correctas para usar con Postman, basadas en la configuración de tu archivo urls.py:

# Diagramas
# Listar diagramas:
# GET /api/diagrams/
# Crear un nuevo diagrama:
# POST /api/diagrams/
# Obtener un diagrama específico:
# GET /api/diagrams/<id>/
# Actualizar un diagrama:
# PUT /api/diagrams/<id>/
# Eliminar un diagrama:
# DELETE /api/diagrams/<id>/
# Duplicar un diagrama:
# POST /api/diagrams/<id>/duplicate/


# Elementos de diagramas
# Listar elementos:
# GET /api/diagram-elements/
# Crear un nuevo elemento:
# POST /api/diagram-elements/
# Actualizar posición de un elemento:
# PATCH /api/diagram-elements/<id>/update_position/
# Atributos de elementos
# Listar atributos:
# GET /api/element-attributes/
# Métodos de elementos
# Listar métodos:
# GET /api/element-methods/
# Relaciones de diagramas
# Listar relaciones:
# GET /api/diagram-relationships/
# Relaciones de un diagrama específico:
    
    
# Versiones de diagramas
# Listar versiones:
# GET /api/diagram-versions/
# Restaurar una versión específica:
# POST /api/diagram-versions/<id>/restore/
# Recuerda que debes reemplazar <id> con el identificador correspondiente del recurso que deseas manipular. Por ejemplo, si quieres obtener el diagrama con ID 5, la ruta sería:
# GET /api/diagrams/5/.




# Para obtener el ID de un elemento que está dentro de un diagrama, necesitarías un endpoint que permita filtrar los elementos por el ID del diagrama al que pertenecen. Basado en tu configuración actual, puedes usar un query parameter para filtrar los elementos.

# Path sugerido:
# Filtrar elementos por diagrama:
# GET /api/diagram-elements/?diagram_id=<id_diagrama>
# Explicación:
# Ruta base: /api/diagram-elements/ es la ruta para listar todos los elementos.
# Query parameter: ?diagram_id=<id_diagrama> permite filtrar los elementos que pertenecen a un diagrama específico.
# Ejemplo:
# Si quieres obtener los elementos del diagrama con ID 5, la ruta sería:
# GET /api/diagram-elements/?diagram_id=5

# Requisitos:
# Para que esta funcionalidad funcione, asegúrate de que:

# En el modelo de DiagramElement, exista una relación con el modelo Diagram (probablemente un ForeignKey).
# Query Parameter:
# GET /api/diagram-elements/?diagram_id=<id_diagrama>&fields=id
# Endpoint Personalizado:
# GET /api/diagram-elements/ids/?diagram_id=<id_diagrama>
# Si necesitas ayuda para implementar alguna de estas opciones, avísame. 