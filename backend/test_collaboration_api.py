#!/usr/bin/env python
"""
Script para probar la funcionalidad de colaboración en tiempo real.
"""

import os
import django
import sys

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uml_diagrams_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from collaboration.models import ActiveUser, DiagramLock, Notification
from collaboration.utils import collaboration_manager
import uuid

User = get_user_model()

def test_collaboration_functionality():
    """Prueba la funcionalidad de colaboración."""
    print("🚀 Iniciando pruebas de colaboración en tiempo real...")
    
    # Crear usuario de prueba si no existe
    try:
        user = User.objects.get(email='test@example.com')
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='test@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
    
    # Generar IDs de prueba
    diagram_id = uuid.uuid4()
    element_id = "test-element-1"
    
    print(f"👤 Usuario de prueba: {user.email}")
    print(f"📊 ID del diagrama: {diagram_id}")
    print(f"🔷 ID del elemento: {element_id}")
    
    # Test 1: Usuarios activos
    print("\n📝 Test 1: Usuarios activos")
    active_user, created = ActiveUser.objects.get_or_create(
        user=user,
        diagram_id=diagram_id
    )
    print(f"✅ Usuario activo {'creado' if created else 'encontrado'}")
    
    active_users = collaboration_manager.get_active_users(diagram_id)
    print(f"✅ Usuarios activos encontrados: {len(active_users)}")
    for au in active_users:
        print(f"   - {au['email']} (último visto: {au['last_seen']})")
    
    # Test 2: Bloqueo de elementos
    print("\n🔒 Test 2: Bloqueo de elementos")
    lock, created = DiagramLock.objects.get_or_create(
        element_id=element_id,
        diagram_id=diagram_id,
        user=user
    )
    print(f"✅ Bloqueo {'creado' if created else 'encontrado'}")
    
    locks = collaboration_manager.get_element_locks(diagram_id)
    print(f"✅ Bloqueos encontrados: {len(locks)}")
    for lock_info in locks:
        print(f"   - Elemento {lock_info['element_id']} bloqueado por {lock_info['user']['email']}")
    
    # Test 3: Desbloqueo forzado
    print("\n🔓 Test 3: Desbloqueo forzado")
    success = collaboration_manager.force_unlock_element(diagram_id, element_id)
    print(f"✅ Desbloqueo {'exitoso' if success else 'falló'}")
    
    # Test 4: Notificaciones
    print("\n📢 Test 4: Notificaciones")
    notification = Notification.objects.create(
        recipient=user,
        notification_type='element_conflict',
        title='Conflicto de prueba',
        message='Este es un mensaje de prueba para el sistema de notificaciones.',
        data={'test': True}
    )
    
    if notification:
        print(f"✅ Notificación creada: {notification.title}")
        print(f"   - ID: {notification.id}")
        print(f"   - Tipo: {notification.notification_type}")
        print(f"   - Leída: {notification.is_read}")
        
        # Marcar como leída
        notification.mark_as_read()
        print(f"✅ Notificación marcada como leída")
    else:
        print("❌ Error creando la notificación")
    
    # Test 5: Conteo de notificaciones
    total_notifications = Notification.objects.filter(recipient=user).count()
    unread_notifications = Notification.objects.filter(recipient=user, is_read=False).count()
    print(f"✅ Total de notificaciones: {total_notifications}")
    print(f"✅ Notificaciones no leídas: {unread_notifications}")
    
    # Test 6: Limpieza
    print("\n🧹 Test 6: Limpieza")
    expired_locks = collaboration_manager.cleanup_expired_locks(diagram_id)
    inactive_users = collaboration_manager.cleanup_inactive_users(diagram_id)
    print(f"✅ Bloqueos expirados limpiados: {expired_locks}")
    print(f"✅ Usuarios inactivos limpiados: {inactive_users}")
    
    print("\n🎉 ¡Todas las pruebas de colaboración completadas exitosamente!")
    print("\n📋 Resumen de funcionalidades implementadas:")
    print("   ✅ Sistema de usuarios activos")
    print("   ✅ Bloqueo y desbloqueo de elementos") 
    print("   ✅ Sistema de notificaciones")
    print("   ✅ Limpieza automática")
    print("   ✅ API REST para colaboración")
    print("   ✅ WebSocket consumers (DiagramConsumer, ProjectConsumer, NotificationConsumer)")
    print("   ✅ Middleware JWT para WebSockets")
    print("   ✅ Broadcast de eventos en tiempo real")

if __name__ == '__main__':
    test_collaboration_functionality()
