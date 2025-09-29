from django.shortcuts import render

# Create your views here.


from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import (
    Diagram,
    DiagramElement,
    ElementAttribute,
    ElementMethod,
    DiagramRelationship,
    DiagramVersion
)
from .serializers import (
    DiagramSerializer,
    DiagramElementSerializer,
    ElementAttributeSerializer,
    ElementMethodSerializer,
    DiagramRelationshipSerializer,
    DiagramVersionSerializer
)

class DiagramViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar diagramas.
    """
    queryset = Diagram.objects.all()
    serializer_class = DiagramSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtrar diagramas por el usuario autenticado
        return self.queryset.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # Asignar el usuario autenticado como creador
        serializer.save(created_by=self.request.user)


class DiagramElementViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar elementos de diagramas.
    """
    queryset = DiagramElement.objects.all()
    serializer_class = DiagramElementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtrar elementos por diagramas del usuario autenticado
        return self.queryset.filter(diagram__created_by=self.request.user)


class ElementAttributeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar atributos de elementos.
    """
    queryset = ElementAttribute.objects.all()
    serializer_class = ElementAttributeSerializer
    permission_classes = [IsAuthenticated]


class ElementMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar métodos de elementos.
    """
    queryset = ElementMethod.objects.all()
    serializer_class = ElementMethodSerializer
    permission_classes = [IsAuthenticated]


class DiagramRelationshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar relaciones entre elementos.
    """
    queryset = DiagramRelationship.objects.all()
    serializer_class = DiagramRelationshipSerializer
    permission_classes = [IsAuthenticated]


class DiagramVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar versiones de diagramas.
    """
    queryset = DiagramVersion.objects.all()
    serializer_class = DiagramVersionSerializer
    permission_classes = [IsAuthenticated]