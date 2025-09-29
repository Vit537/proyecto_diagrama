from django.shortcuts import render
from rest_framework import viewsets, status, permissions

# Create your views here.


from rest_framework import viewsets
from .models import Producto
from .serializers import ProductoSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]  # 👈 protege este endpoint
    queryset = Producto.objects.all().order_by('-creado')
    serializer_class = ProductoSerializer
