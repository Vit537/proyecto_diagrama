import os
import tempfile
from typing import Dict, Any
from django.http import JsonResponse, HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from django.core.files.base import ContentFile

from diagrams.models import Diagram
from .models import (
    CodeGenerationTemplate, CodeGenerationJob, GeneratedFile,
    DatabaseSchema, CodeGenerationHistory
)
from .serializers import (
    CodeGenerationTemplateSerializer, CodeGenerationJobSerializer,
    CodeGenerationRequestSerializer, DatabaseScriptGenerationSerializer,
    CodeGenerationHistorySerializer
)
from .services import SpringBootCodeGenerator, DatabaseScriptGenerator, CodeGenerationService


class CodeGenerationTemplateListView(generics.ListCreateAPIView):
    """List and create code generation templates"""
    queryset = CodeGenerationTemplate.objects.filter(is_active=True)
    serializer_class = CodeGenerationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CodeGenerationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a code generation template"""
    queryset = CodeGenerationTemplate.objects.all()
    serializer_class = CodeGenerationTemplateSerializer
    permission_classes = [IsAuthenticated]


class SpringBootGenerationView(APIView):
    """Generate Spring Boot application from database diagram"""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def post(self, request):
        """Generate Spring Boot project"""
        serializer = CodeGenerationRequestSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        diagram_id = serializer.validated_data['diagram_id']
        template_type = serializer.validated_data['template_type']
        language = serializer.validated_data['language']
        output_format = serializer.validated_data['output_format']
        
        # Spring Boot specific configuration
        config = {
            'package_name': serializer.validated_data.get('package_name', 'com.example.app'),
            'project_name': serializer.validated_data.get('project_name', 'generated-app'),
            'spring_boot_version': serializer.validated_data.get('spring_boot_version', '3.2.0'),
            'java_version': serializer.validated_data.get('java_version', '17'),
            'include_tests': serializer.validated_data.get('include_tests', True),
            'include_swagger': serializer.validated_data.get('include_swagger', True),
            'include_security': serializer.validated_data.get('include_security', False),
        }
        
        try:
            # Get diagram
            diagram = Diagram.objects.get(id=diagram_id)
            
            # Validate diagram type for Spring Boot generation
            if diagram.diagram_type not in ['database', 'er', 'class']:
                return Response({
                    'error': 'Spring Boot generation only supports database, ER, and class diagrams.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create default template
            template, created = CodeGenerationTemplate.objects.get_or_create(
                template_type=template_type,
                language=language,
                is_default=True,
                defaults={
                    'name': f'Default {template_type.title()} {language.title()} Template',
                    'description': f'Default template for {template_type} code generation in {language}',
                    'version': '1.0',
                    'template_content': {},
                    'created_by': request.user
                }
            )
            
            # Create generation job
            job = CodeGenerationJob.objects.create(
                diagram=diagram,
                template=template,
                requested_by=request.user,
                output_format=output_format,
                configuration=config,
                status='processing',
                started_at=timezone.now()
            )
            
            # Generate Spring Boot project
            generator = SpringBootCodeGenerator(diagram, config)
            generated_files = generator.generate_project()
            
            # Save generated files to database
            total_size = 0
            for file_info in generated_files:
                generated_file = GeneratedFile.objects.create(
                    generation_job=job,
                    file_path=file_info['file_path'],
                    file_name=file_info['file_name'],
                    file_type=file_info['file_type'],
                    content=file_info['content'],
                    size=file_info['size'],
                    based_on_element_id=file_info.get('based_on_element')
                )
                total_size += file_info['size']
            
            # Create ZIP file if requested
            if output_format == 'zip':
                zip_path = CodeGenerationService.create_zip_file(
                    generated_files, 
                    config['project_name']
                )
                
                # Save ZIP file to model
                with open(zip_path, 'rb') as f:
                    job.output_file.save(
                        f"{config['project_name']}.zip",
                        ContentFile(f.read()),
                        save=True
                    )
                
                # Clean up temporary file
                os.unlink(zip_path)
            
            # Update job status
            job.status = 'completed'
            job.completed_at = timezone.now()
            job.output_size = total_size
            job.save()
            
            # Create history entry
            CodeGenerationHistory.objects.create(
                diagram=diagram,
                generation_job=job,
                diagram_version=diagram.version,
                generated_at=timezone.now(),
                files_count=len(generated_files),
                total_size=total_size
            )
            
            # Return job details
            serializer = CodeGenerationJobSerializer(job)
            return Response({
                'message': 'Spring Boot project generated successfully',
                'job': serializer.data,
                'files_count': len(generated_files),
                'total_size': total_size
            }, status=status.HTTP_201_CREATED)
            
        except Diagram.DoesNotExist:
            return Response({
                'error': 'Diagram not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Update job status to failed if it exists
            if 'job' in locals():
                job.status = 'failed'
                job.error_message = str(e)
                job.completed_at = timezone.now()
                job.save()
            
            return Response({
                'error': f'Code generation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DatabaseScriptGenerationView(APIView):
    """Generate database scripts from database diagram"""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def post(self, request):
        """Generate database scripts"""
        serializer = DatabaseScriptGenerationSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        diagram_id = serializer.validated_data['diagram_id']
        database_types = serializer.validated_data['database_types']
        include_constraints = serializer.validated_data['include_constraints']
        include_indexes = serializer.validated_data['include_indexes']
        include_sample_data = serializer.validated_data['include_sample_data']
        schema_name = serializer.validated_data.get('schema_name')
        
        config = {
            'include_constraints': include_constraints,
            'include_indexes': include_indexes,
            'include_sample_data': include_sample_data,
            'schema_name': schema_name
        }
        
        try:
            # Get diagram
            diagram = Diagram.objects.get(id=diagram_id)
            
            # Generate scripts
            generator = DatabaseScriptGenerator(diagram)
            scripts = generator.generate_scripts(database_types, config)
            
            # Get or create database template
            template, created = CodeGenerationTemplate.objects.get_or_create(
                template_type='database',
                language='sql',
                is_default=True,
                defaults={
                    'name': 'Default Database Script Template',
                    'description': 'Default template for database script generation',
                    'version': '1.0',
                    'template_content': {},
                    'created_by': request.user
                }
            )
            
            # Create generation job
            job = CodeGenerationJob.objects.create(
                diagram=diagram,
                template=template,
                requested_by=request.user,
                output_format='folder',
                configuration=config,
                status='processing',
                started_at=timezone.now()
            )
            
            # Save database schemas
            total_size = 0
            for db_type, script in scripts.items():
                schema = DatabaseSchema.objects.create(
                    generation_job=job,
                    database_type=db_type,
                    schema_name=schema_name or 'default',
                    ddl_script=script,
                    migration_scripts=[],
                    indexes=[],
                    constraints=[]
                )
                
                # Also save as generated file
                file_name = f"{diagram.name}_{db_type}.sql"
                generated_file = GeneratedFile.objects.create(
                    generation_job=job,
                    file_path='sql',
                    file_name=file_name,
                    file_type='schema',
                    content=script,
                    size=len(script.encode('utf-8'))
                )
                total_size += len(script.encode('utf-8'))
            
            # Update job status
            job.status = 'completed'
            job.completed_at = timezone.now()
            job.output_size = total_size
            job.save()
            
            # Create history entry
            CodeGenerationHistory.objects.create(
                diagram=diagram,
                generation_job=job,
                diagram_version=diagram.version,
                generated_at=timezone.now(),
                files_count=len(scripts),
                total_size=total_size
            )
            
            # Return scripts directly
            return Response({
                'message': 'Database scripts generated successfully',
                'job_id': job.id,
                'scripts': scripts,
                'database_types': list(scripts.keys()),
                'total_size': total_size
            }, status=status.HTTP_201_CREATED)
            
        except Diagram.DoesNotExist:
            return Response({
                'error': 'Diagram not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Update job status to failed if it exists
            if 'job' in locals():
                job.status = 'failed'
                job.error_message = str(e)
                job.completed_at = timezone.now()
                job.save()
            
            return Response({
                'error': f'Database script generation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CodeGenerationJobListView(generics.ListAPIView):
    """List code generation jobs for the current user"""
    serializer_class = CodeGenerationJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CodeGenerationJob.objects.filter(
            requested_by=self.request.user
        ).order_by('-created_at')


class CodeGenerationJobDetailView(generics.RetrieveAPIView):
    """Retrieve details of a specific code generation job"""
    serializer_class = CodeGenerationJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CodeGenerationJob.objects.filter(requested_by=self.request.user)


class CodeGenerationJobDownloadView(APIView):
    """Download generated code files"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Download generated files as ZIP or individual file"""
        try:
            job = CodeGenerationJob.objects.get(
                id=pk,
                requested_by=request.user,
                status='completed'
            )
            
            # Increment download count
            if hasattr(job, 'history_entries') and job.history_entries.exists():
                history = job.history_entries.first()
                history.download_count += 1
                history.save()
            
            # If ZIP file exists, return it
            if job.output_file:
                response = FileResponse(
                    job.output_file.open('rb'),
                    as_attachment=True,
                    filename=os.path.basename(job.output_file.name)
                )
                return response
            
            # Otherwise, create ZIP on-the-fly from generated files
            generated_files = job.generated_files.all()
            if not generated_files.exists():
                return Response({
                    'error': 'No generated files found for this job'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Prepare files for ZIP creation
            files_data = []
            for gen_file in generated_files:
                files_data.append({
                    'file_path': gen_file.file_path,
                    'file_name': gen_file.file_name,
                    'content': gen_file.content,
                    'size': gen_file.size
                })
            
            # Create temporary ZIP file
            project_name = job.configuration.get('project_name', f'generated-{job.id}')
            zip_path = CodeGenerationService.create_zip_file(files_data, project_name)
            
            # Return ZIP file
            def file_iterator(file_path, chunk_size=8192):
                with open(file_path, 'rb') as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk
                # Clean up temporary file after streaming
                os.unlink(file_path)
            
            response = HttpResponse(
                file_iterator(zip_path),
                content_type='application/zip'
            )
            response['Content-Disposition'] = f'attachment; filename="{project_name}.zip"'
            return response
            
        except CodeGenerationJob.DoesNotExist:
            return Response({
                'error': 'Code generation job not found or not completed'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Download failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CodeGenerationHistoryView(generics.ListAPIView):
    """List code generation history for diagrams"""
    serializer_class = CodeGenerationHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        diagram_id = self.request.query_params.get('diagram_id')
        queryset = CodeGenerationHistory.objects.all()
        
        if diagram_id:
            queryset = queryset.filter(diagram_id=diagram_id)
        
        # Filter by user's accessible diagrams
        user_diagrams = Diagram.objects.filter(
            project__in=self.request.user.owned_projects.all().union(
                Diagram.objects.filter(
                    project__collaborators__user=self.request.user
                ).values('project')
            )
        )
        
        return queryset.filter(diagram__in=user_diagrams).order_by('-generated_at')
