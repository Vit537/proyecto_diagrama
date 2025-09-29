from django.urls import path
from . import views

urlpatterns = [
    # Code generation templates
    path('templates/', views.CodeGenerationTemplateListView.as_view(), name='code-generation-templates'),
    path('templates/<uuid:pk>/', views.CodeGenerationTemplateDetailView.as_view(), name='code-generation-template-detail'),
    
    # Spring Boot generation
    path('generate/spring-boot/', views.SpringBootGenerationView.as_view(), name='generate-spring-boot'),
    
    # Database scripts generation
    path('generate/database-scripts/', views.DatabaseScriptGenerationView.as_view(), name='generate-database-scripts'),
    
    # Code generation jobs
    path('jobs/', views.CodeGenerationJobListView.as_view(), name='code-generation-jobs'),
    path('jobs/<uuid:pk>/', views.CodeGenerationJobDetailView.as_view(), name='code-generation-job-detail'),
    path('jobs/<uuid:pk>/download/', views.CodeGenerationJobDownloadView.as_view(), name='code-generation-job-download'),
]
