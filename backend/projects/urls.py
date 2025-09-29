from django.urls import path, include
from rest_framework.routers import DefaultRouter
# from .views import ProjectViewSet
from .views_complete import ProjectViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='projects')
# router.register(r'projects', SimpleProjectViewSet, basename='projects')

app_name = 'projects'
# print("Router URLs:", router.urls),
urlpatterns = [
    
    path('', include(router.urls)),
     
]

# URL patterns generated:
# GET    /api/projects/                      - List all accessible projects
# POST   /api/projects/                      - Create new project
# GET    /api/projects/{id}/                 - Get specific project
# PUT    /api/projects/{id}/                 - Update project
# PATCH  /api/projects/{id}/                 - Partial update project
# DELETE /api/projects/{id}/                 - Delete project (owner only)
#
# Custom actions:
# GET    /api/projects/my_projects/          - Get user's owned projects
# POST   /api/projects/{id}/invite/          - Invite user to project
# POST   /api/projects/{id}/remove_collaborator/  - Remove collaborator
# POST   /api/projects/{id}/update_role/     - Update collaborator role
# GET    /api/projects/{id}/collaborators/   - Get project collaborators
# GET    /api/projects/{id}/stats/           - Get project statistics
# GET    /api/projects/{id}/settings/        - Get project settings
# PUT    /api/projects/{id}/settings/        - Update project settings
# PATCH  /api/projects/{id}/settings/        - Partial update project settings
# POST   /api/projects/{id}/archive/         - Archive/unarchive project
