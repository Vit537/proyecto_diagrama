import os
import zipfile
import tempfile
import shutil
from typing import Dict, List, Any
from datetime import datetime
from django.utils import timezone
from django.core.files.base import ContentFile
from django.template import Template, Context

from diagrams.models import Diagram, DiagramElement, ElementAttribute, DiagramRelationship
from .models import (
    CodeGenerationJob, GeneratedFile, DatabaseSchema,
    CodeGenerationHistory, CodeGenerationTemplate
)


class SpringBootCodeGenerator:
    """Generator for Spring Boot applications from database diagrams"""
    
    def __init__(self, diagram: Diagram, config: Dict[str, Any]):
        self.diagram = diagram
        self.config = config
        self.package_name = config.get('package_name', 'com.example.app')
        self.project_name = config.get('project_name', 'generated-app')
        self.spring_boot_version = config.get('spring_boot_version', '3.2.0')
        self.java_version = config.get('java_version', '17')
        self.include_tests = config.get('include_tests', True)
        self.include_swagger = config.get('include_swagger', True)
        self.include_security = config.get('include_security', False)
        
        # Package path for file structure
        self.package_path = self.package_name.replace('.', '/')
        
    def generate_project(self) -> List[Dict[str, Any]]:
        """Generate complete Spring Boot project"""
        files = []
        
        # Generate project structure files
        files.extend(self._generate_project_structure())
        
        # Generate entities from diagram elements
        files.extend(self._generate_entities())
        
        # Generate repositories
        files.extend(self._generate_repositories())
        
        # Generate services
        files.extend(self._generate_services())
        
        # Generate controllers
        files.extend(self._generate_controllers())
        
        # Generate DTOs
        files.extend(self._generate_dtos())
        
        # Generate configuration
        files.extend(self._generate_configuration())
        
        if self.include_tests:
            files.extend(self._generate_tests())
            
        if self.include_swagger:
            files.extend(self._generate_swagger_config())
            
        if self.include_security:
            files.extend(self._generate_security_config())
        
        return files
    
    def _generate_project_structure(self) -> List[Dict[str, Any]]:
        """Generate basic project structure files"""
        files = []
        
        # pom.xml
        pom_content = self._generate_pom_xml()
        files.append({
            'file_path': '',
            'file_name': 'pom.xml',
            'file_type': 'config',
            'content': pom_content,
            'size': len(pom_content.encode('utf-8'))
        })
        
        # application.properties
        app_props_content = self._generate_application_properties()
        files.append({
            'file_path': 'src/main/resources',
            'file_name': 'application.properties',
            'file_type': 'config',
            'content': app_props_content,
            'size': len(app_props_content.encode('utf-8'))
        })
        
        # Main application class
        main_class_content = self._generate_main_application_class()
        files.append({
            'file_path': f'src/main/java/{self.package_path}',
            'file_name': f'{self._to_pascal_case(self.project_name)}Application.java',
            'file_type': 'config',
            'content': main_class_content,
            'size': len(main_class_content.encode('utf-8'))
        })
        
        # README.md
        readme_content = self._generate_readme()
        files.append({
            'file_path': '',
            'file_name': 'README.md',
            'file_type': 'documentation',
            'content': readme_content,
            'size': len(readme_content.encode('utf-8'))
        })
        
        return files
    
    def _generate_entities(self) -> List[Dict[str, Any]]:
        """Generate JPA entities from diagram elements"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            entity_content = self._generate_entity_class(element)
            files.append({
                'file_path': f'src/main/java/{self.package_path}/entity',
                'file_name': f'{self._to_pascal_case(element.name)}.java',
                'file_type': 'entity',
                'content': entity_content,
                'size': len(entity_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_repositories(self) -> List[Dict[str, Any]]:
        """Generate JPA repositories"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            repo_content = self._generate_repository_interface(element)
            files.append({
                'file_path': f'src/main/java/{self.package_path}/repository',
                'file_name': f'{self._to_pascal_case(element.name)}Repository.java',
                'file_type': 'repository',
                'content': repo_content,
                'size': len(repo_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_services(self) -> List[Dict[str, Any]]:
        """Generate service classes"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            service_content = self._generate_service_class(element)
            files.append({
                'file_path': f'src/main/java/{self.package_path}/service',
                'file_name': f'{self._to_pascal_case(element.name)}Service.java',
                'file_type': 'service',
                'content': service_content,
                'size': len(service_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_controllers(self) -> List[Dict[str, Any]]:
        """Generate REST controllers"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            controller_content = self._generate_controller_class(element)
            files.append({
                'file_path': f'src/main/java/{self.package_path}/controller',
                'file_name': f'{self._to_pascal_case(element.name)}Controller.java',
                'file_type': 'controller',
                'content': controller_content,
                'size': len(controller_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_dtos(self) -> List[Dict[str, Any]]:
        """Generate DTO classes"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            dto_content = self._generate_dto_class(element)
            files.append({
                'file_path': f'src/main/java/{self.package_path}/dto',
                'file_name': f'{self._to_pascal_case(element.name)}DTO.java',
                'file_type': 'entity',
                'content': dto_content,
                'size': len(dto_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_configuration(self) -> List[Dict[str, Any]]:
        """Generate configuration classes"""
        files = []
        
        # Database configuration
        db_config_content = self._generate_database_config()
        files.append({
            'file_path': f'src/main/java/{self.package_path}/config',
            'file_name': 'DatabaseConfig.java',
            'file_type': 'config',
            'content': db_config_content,
            'size': len(db_config_content.encode('utf-8'))
        })
        
        return files
    
    def _generate_tests(self) -> List[Dict[str, Any]]:
        """Generate test classes"""
        files = []
        entities = self.diagram.elements.filter(element_type__in=['table', 'class'])
        
        for element in entities:
            test_content = self._generate_test_class(element)
            files.append({
                'file_path': f'src/test/java/{self.package_path}/service',
                'file_name': f'{self._to_pascal_case(element.name)}ServiceTest.java',
                'file_type': 'test',
                'content': test_content,
                'size': len(test_content.encode('utf-8')),
                'based_on_element': element.id
            })
        
        return files
    
    def _generate_swagger_config(self) -> List[Dict[str, Any]]:
        """Generate Swagger/OpenAPI configuration"""
        files = []
        
        swagger_content = f"""package {self.package_name}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {{
    
    @Bean
    public OpenAPI customOpenAPI() {{
        return new OpenAPI()
                .info(new Info()
                        .title("{self.project_name.replace('-', ' ').title()} API")
                        .version("1.0")
                        .description("Generated API documentation for {self.project_name}")
                        .contact(new Contact()
                                .name("API Support")
                                .email("support@example.com")));
    }}
}}"""
        
        files.append({
            'file_path': f'src/main/java/{self.package_path}/config',
            'file_name': 'SwaggerConfig.java',
            'file_type': 'config',
            'content': swagger_content,
            'size': len(swagger_content.encode('utf-8'))
        })
        
        return files
    
    def _generate_security_config(self) -> List[Dict[str, Any]]:
        """Generate security configuration"""
        files = []
        
        security_content = f"""package {self.package_name}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {{
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {{
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/public/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt());
        
        return http.build();
    }}
}}"""
        
        files.append({
            'file_path': f'src/main/java/{self.package_path}/config',
            'file_name': 'SecurityConfig.java',
            'file_type': 'config',
            'content': security_content,
            'size': len(security_content.encode('utf-8'))
        })
        
        return files

    def _generate_pom_xml(self) -> str:
        """Generate pom.xml content"""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>{self.spring_boot_version}</version>
        <relativePath/>
    </parent>
    <groupId>{self.package_name}</groupId>
    <artifactId>{self.project_name}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>{self.project_name}</name>
    <description>Generated Spring Boot application from UML diagram</description>
    <properties>
        <java.version>{self.java_version}</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>{''.join([
        f'''
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.2.0</version>
        </dependency>''' if self.include_swagger else '',
        f'''
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>''' if self.include_security else ''
        ])}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>"""

    def _generate_application_properties(self) -> str:
        """Generate application.properties content"""
        return f"""# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/{self.project_name.replace('-', '_')}
spring.datasource.username=postgres
spring.datasource.password=password

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Application Configuration
server.port=8080
server.servlet.context-path=/api

# Logging
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE{''.join([
f'''

# Swagger Configuration
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html''' if self.include_swagger else '',
f'''

# Security Configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://your-auth-server.com''' if self.include_security else ''
])}"""

    def _generate_main_application_class(self) -> str:
        """Generate main application class"""
        class_name = self._to_pascal_case(self.project_name)
        return f"""package {self.package_name};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class {class_name}Application {{

    public static void main(String[] args) {{
        SpringApplication.run({class_name}Application.class, args);
    }}
}}"""

    def _generate_readme(self) -> str:
        """Generate README.md content"""
        return f"""# {self.project_name.replace('-', ' ').title()}

Generated Spring Boot application from UML diagram.

## Description
This application was automatically generated from a UML diagram using the UML Collaborative Diagram Platform (UMLCDP).

## Technology Stack
- Spring Boot {self.spring_boot_version}
- Java {self.java_version}
- Spring Data JPA
- PostgreSQL{''.join([
f'''
- Spring Security''' if self.include_security else '',
f'''
- OpenAPI 3 / Swagger''' if self.include_swagger else ''
])}

## Getting Started

### Prerequisites
- Java {self.java_version} or higher
- Maven 3.6+
- PostgreSQL database

### Installation
1. Clone this repository
2. Configure your database connection in `src/main/resources/application.properties`
3. Run `mvn clean install`
4. Run `mvn spring-boot:run`

### API Documentation
{'The API documentation is available at http://localhost:8080/swagger-ui.html' if self.include_swagger else 'API endpoints are available under /api'}

## Generated Files
This project includes:
- Entity classes mapped to database tables
- Repository interfaces for data access
- Service classes for business logic
- REST controllers for API endpoints
- DTO classes for data transfer{''.join([
f'''
- Test classes for unit testing''' if self.include_tests else '',
f'''
- Security configuration''' if self.include_security else ''
])}

## Database Schema
The application expects a PostgreSQL database with tables corresponding to the UML diagram elements.

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    def _generate_entity_class(self, element: DiagramElement) -> str:
        """Generate JPA entity class for a diagram element"""
        class_name = self._to_pascal_case(element.name)
        attributes = element.attributes.all().order_by('order')
        
        # Build imports
        imports = [
            'jakarta.persistence.*',
            'jakarta.validation.constraints.*',
            'java.time.LocalDateTime'
        ]
        
        # Check if we need additional imports
        for attr in attributes:
            if self._get_java_type(attr.data_type) in ['BigDecimal']:
                imports.append('java.math.BigDecimal')
            elif 'Date' in self._get_java_type(attr.data_type):
                imports.append('java.time.LocalDate')
        
        # Build fields
        fields = []
        for attr in attributes:
            field_code = self._generate_field_code(attr)
            fields.append(field_code)
        
        # Build relationships
        relationships = self._get_entity_relationships(element)
        for rel in relationships:
            fields.append(rel)
        
        # Generate constructor, getters, setters
        constructor_args = [f"{self._get_java_type(attr.data_type)} {self._to_camel_case(attr.name)}" 
                          for attr in attributes if not self._is_id_field(attr)]
        
        return f"""package {self.package_name}.entity;

{chr(10).join(f'import {imp};' for imp in imports)}

@Entity
@Table(name = "{element.name.lower()}")
public class {class_name} {{
    
{chr(10).join(fields)}

    // Default constructor
    public {class_name}() {{}}

    // Constructor with fields
    public {class_name}({', '.join(constructor_args)}) {{
{chr(10).join(f'        this.{self._to_camel_case(attr.name)} = {self._to_camel_case(attr.name)};' 
              for attr in attributes if not self._is_id_field(attr))}
    }}

    // Getters and Setters
{chr(10).join(self._generate_getter_setter(attr) for attr in attributes)}
}}"""

    def _generate_repository_interface(self, element: DiagramElement) -> str:
        """Generate JPA repository interface"""
        class_name = self._to_pascal_case(element.name)
        id_type = self._get_id_type(element)
        
        return f"""package {self.package_name}.repository;

import {self.package_name}.entity.{class_name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface {class_name}Repository extends JpaRepository<{class_name}, {id_type}> {{
    
    // Custom query methods can be added here
    // Example: List<{class_name}> findByStatus(String status);
}}"""

    def _generate_service_class(self, element: DiagramElement) -> str:
        """Generate service class"""
        class_name = self._to_pascal_case(element.name)
        id_type = self._get_id_type(element)
        
        return f"""package {self.package_name}.service;

import {self.package_name}.entity.{class_name};
import {self.package_name}.repository.{class_name}Repository;
import {self.package_name}.dto.{class_name}DTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class {class_name}Service {{
    
    @Autowired
    private {class_name}Repository {self._to_camel_case(class_name)}Repository;
    
    public List<{class_name}> findAll() {{
        return {self._to_camel_case(class_name)}Repository.findAll();
    }}
    
    public Optional<{class_name}> findById({id_type} id) {{
        return {self._to_camel_case(class_name)}Repository.findById(id);
    }}
    
    public {class_name} save({class_name} {self._to_camel_case(class_name)}) {{
        return {self._to_camel_case(class_name)}Repository.save({self._to_camel_case(class_name)});
    }}
    
    public {class_name} create({class_name}DTO {self._to_camel_case(class_name)}DTO) {{
        {class_name} {self._to_camel_case(class_name)} = convertToEntity({self._to_camel_case(class_name)}DTO);
        return {self._to_camel_case(class_name)}Repository.save({self._to_camel_case(class_name)});
    }}
    
    public Optional<{class_name}> update({id_type} id, {class_name}DTO {self._to_camel_case(class_name)}DTO) {{
        return {self._to_camel_case(class_name)}Repository.findById(id)
                .map({self._to_camel_case(class_name)} -> {{
                    updateEntityFromDTO({self._to_camel_case(class_name)}, {self._to_camel_case(class_name)}DTO);
                    return {self._to_camel_case(class_name)}Repository.save({self._to_camel_case(class_name)});
                }});
    }}
    
    public boolean deleteById({id_type} id) {{
        if ({self._to_camel_case(class_name)}Repository.existsById(id)) {{
            {self._to_camel_case(class_name)}Repository.deleteById(id);
            return true;
        }}
        return false;
    }}
    
    private {class_name} convertToEntity({class_name}DTO dto) {{
        // Convert DTO to Entity
        {class_name} entity = new {class_name}();
        // Set fields from DTO
        return entity;
    }}
    
    private void updateEntityFromDTO({class_name} entity, {class_name}DTO dto) {{
        // Update entity fields from DTO
    }}
}}"""

    def _generate_controller_class(self, element: DiagramElement) -> str:
        """Generate REST controller class"""
        class_name = self._to_pascal_case(element.name)
        id_type = self._get_id_type(element)
        resource_name = element.name.lower()
        
        return f"""package {self.package_name}.controller;

import {self.package_name}.entity.{class_name};
import {self.package_name}.service.{class_name}Service;
import {self.package_name}.dto.{class_name}DTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;{''.join([
f'''
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;''' if self.include_swagger else ''
])}

@RestController
@RequestMapping("/api/{resource_name}")
@CrossOrigin(origins = "*"){''.join([
f'''
@Tag(name = "{class_name}", description = "{class_name} management APIs")''' if self.include_swagger else ''
])}
public class {class_name}Controller {{
    
    @Autowired
    private {class_name}Service {self._to_camel_case(class_name)}Service;
    
    {'@Operation(summary = "Get all ' + resource_name + 's")' if self.include_swagger else ''}
    @GetMapping
    public ResponseEntity<List<{class_name}>> getAll{class_name}s() {{
        List<{class_name}> {resource_name}s = {self._to_camel_case(class_name)}Service.findAll();
        return ResponseEntity.ok({resource_name}s);
    }}
    
    {'@Operation(summary = "Get ' + resource_name + ' by ID")' if self.include_swagger else ''}
    @GetMapping("/{{id}}")
    public ResponseEntity<{class_name}> get{class_name}ById(@PathVariable {id_type} id) {{
        return {self._to_camel_case(class_name)}Service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }}
    
    {'@Operation(summary = "Create new ' + resource_name + '")' if self.include_swagger else ''}
    @PostMapping
    public ResponseEntity<{class_name}> create{class_name}(@Valid @RequestBody {class_name}DTO {self._to_camel_case(class_name)}DTO) {{
        {class_name} created{class_name} = {self._to_camel_case(class_name)}Service.create({self._to_camel_case(class_name)}DTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created{class_name});
    }}
    
    {'@Operation(summary = "Update ' + resource_name + '")' if self.include_swagger else ''}
    @PutMapping("/{{id}}")
    public ResponseEntity<{class_name}> update{class_name}(@PathVariable {id_type} id, 
                                                      @Valid @RequestBody {class_name}DTO {self._to_camel_case(class_name)}DTO) {{
        return {self._to_camel_case(class_name)}Service.update(id, {self._to_camel_case(class_name)}DTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }}
    
    {'@Operation(summary = "Delete ' + resource_name + '")' if self.include_swagger else ''}
    @DeleteMapping("/{{id}}")
    public ResponseEntity<Void> delete{class_name}(@PathVariable {id_type} id) {{
        if ({self._to_camel_case(class_name)}Service.deleteById(id)) {{
            return ResponseEntity.noContent().build();
        }}
        return ResponseEntity.notFound().build();
    }}
}}"""

    def _generate_dto_class(self, element: DiagramElement) -> str:
        """Generate DTO class"""
        class_name = self._to_pascal_case(element.name)
        attributes = element.attributes.all().order_by('order')
        
        return f"""package {self.package_name}.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class {class_name}DTO {{
    
{chr(10).join(self._generate_dto_field(attr) for attr in attributes)}

    // Default constructor
    public {class_name}DTO() {{}}

    // Getters and Setters
{chr(10).join(self._generate_getter_setter(attr) for attr in attributes)}
}}"""

    def _generate_database_config(self) -> str:
        """Generate database configuration class"""
        return f"""package {self.package_name}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "{self.package_name}.repository")
@EnableTransactionManagement
public class DatabaseConfig {{
    // Database configuration beans can be added here
}}"""

    def _generate_test_class(self, element: DiagramElement) -> str:
        """Generate test class for service"""
        class_name = self._to_pascal_case(element.name)
        
        return f"""package {self.package_name}.service;

import {self.package_name}.entity.{class_name};
import {self.package_name}.repository.{class_name}Repository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
public class {class_name}ServiceTest {{
    
    @Mock
    private {class_name}Repository {self._to_camel_case(class_name)}Repository;
    
    @InjectMocks
    private {class_name}Service {self._to_camel_case(class_name)}Service;
    
    @BeforeEach
    void setUp() {{
        MockitoAnnotations.openMocks(this);
    }}
    
    @Test
    void testFindAll() {{
        // Given
        {class_name} {self._to_camel_case(class_name)}1 = new {class_name}();
        {class_name} {self._to_camel_case(class_name)}2 = new {class_name}();
        List<{class_name}> {self._to_camel_case(class_name)}s = Arrays.asList({self._to_camel_case(class_name)}1, {self._to_camel_case(class_name)}2);
        
        when({self._to_camel_case(class_name)}Repository.findAll()).thenReturn({self._to_camel_case(class_name)}s);
        
        // When
        List<{class_name}> result = {self._to_camel_case(class_name)}Service.findAll();
        
        // Then
        assertEquals(2, result.size());
        verify({self._to_camel_case(class_name)}Repository).findAll();
    }}
    
    @Test
    void testFindById() {{
        // Given
        Long id = 1L;
        {class_name} {self._to_camel_case(class_name)} = new {class_name}();
        when({self._to_camel_case(class_name)}Repository.findById(id)).thenReturn(Optional.of({self._to_camel_case(class_name)}));
        
        // When
        Optional<{class_name}> result = {self._to_camel_case(class_name)}Service.findById(id);
        
        // Then
        assertTrue(result.isPresent());
        verify({self._to_camel_case(class_name)}Repository).findById(id);
    }}
}}"""

    # Helper methods
    def _generate_field_code(self, attr: ElementAttribute) -> str:
        """Generate field code for entity attribute"""
        field_name = self._to_camel_case(attr.name)
        java_type = self._get_java_type(attr.data_type)
        
        annotations = []
        
        # ID field
        if self._is_id_field(attr):
            annotations.append("@Id")
            annotations.append("@GeneratedValue(strategy = GenerationType.IDENTITY)")
        
        # Column annotation
        column_props = []
        if attr.constraints.get('nullable', True) is False:
            column_props.append('nullable = false')
        if attr.constraints.get('unique', False):
            column_props.append('unique = true')
        if attr.data_type in ['varchar', 'text'] and 'max_length' in attr.constraints:
            column_props.append(f"length = {attr.constraints['max_length']}")
        
        if column_props:
            annotations.append(f'@Column({", ".join(column_props)})')
        else:
            annotations.append(f'@Column(name = "{attr.name.lower()}")')
        
        # Validation annotations
        if not attr.constraints.get('nullable', True):
            annotations.append('@NotNull')
        
        if attr.data_type in ['varchar', 'text'] and 'max_length' in attr.constraints:
            annotations.append(f"@Size(max = {attr.constraints['max_length']})")
        
        annotation_str = '\n    '.join(annotations)
        
        return f"""    {annotation_str}
    private {java_type} {field_name};"""

    def _generate_dto_field(self, attr: ElementAttribute) -> str:
        """Generate field code for DTO attribute"""
        field_name = self._to_camel_case(attr.name)
        java_type = self._get_java_type(attr.data_type)
        
        annotations = []
        
        # Validation annotations
        if not attr.constraints.get('nullable', True) and not self._is_id_field(attr):
            annotations.append('@NotNull')
        
        if attr.data_type in ['varchar', 'text'] and 'max_length' in attr.constraints:
            annotations.append(f"@Size(max = {attr.constraints['max_length']})")
        
        if attr.data_type == 'email':
            annotations.append('@Email')
        
        annotation_str = '\n    '.join(annotations) if annotations else ''
        
        return f"""    {annotation_str + chr(10) + '    ' if annotation_str else ''}private {java_type} {field_name};"""

    def _generate_getter_setter(self, attr: ElementAttribute) -> str:
        """Generate getter and setter methods"""
        field_name = self._to_camel_case(attr.name)
        method_name = self._to_pascal_case(attr.name)
        java_type = self._get_java_type(attr.data_type)
        
        return f"""    public {java_type} get{method_name}() {{
        return {field_name};
    }}
    
    public void set{method_name}({java_type} {field_name}) {{
        this.{field_name} = {field_name};
    }}"""

    def _get_entity_relationships(self, element: DiagramElement) -> List[str]:
        """Get JPA relationships for entity"""
        relationships = []
        
        # Get outgoing relationships
        outgoing = element.outgoing_relationships.all()
        for rel in outgoing:
            rel_code = self._generate_relationship_code(rel, 'source')
            if rel_code:
                relationships.append(rel_code)
        
        # Get incoming relationships
        incoming = element.incoming_relationships.all()
        for rel in incoming:
            rel_code = self._generate_relationship_code(rel, 'target')
            if rel_code:
                relationships.append(rel_code)
        
        return relationships

    def _generate_relationship_code(self, relationship: DiagramRelationship, direction: str) -> str:
        """Generate JPA relationship annotation code"""
        if relationship.relationship_type == 'one_to_many':
            if direction == 'source':
                target_name = self._to_pascal_case(relationship.target_element.name)
                field_name = self._to_camel_case(relationship.target_element.name) + 's'
                return f"""    @OneToMany(mappedBy = "{self._to_camel_case(relationship.source_element.name)}", cascade = CascadeType.ALL)
    private List<{target_name}> {field_name};"""
            else:
                source_name = self._to_pascal_case(relationship.source_element.name)
                field_name = self._to_camel_case(relationship.source_element.name)
                return f"""    @ManyToOne
    @JoinColumn(name = "{relationship.source_element.name.lower()}_id")
    private {source_name} {field_name};"""
        
        elif relationship.relationship_type == 'many_to_many':
            if direction == 'source':
                target_name = self._to_pascal_case(relationship.target_element.name)
                field_name = self._to_camel_case(relationship.target_element.name) + 's'
                join_table = f"{relationship.source_element.name.lower()}_{relationship.target_element.name.lower()}"
                return f"""    @ManyToMany
    @JoinTable(name = "{join_table}",
               joinColumns = @JoinColumn(name = "{relationship.source_element.name.lower()}_id"),
               inverseJoinColumns = @JoinColumn(name = "{relationship.target_element.name.lower()}_id"))
    private List<{target_name}> {field_name};"""
            else:
                source_name = self._to_pascal_case(relationship.source_element.name)
                field_name = self._to_camel_case(relationship.source_element.name) + 's'
                return f"""    @ManyToMany(mappedBy = "{self._to_camel_case(relationship.target_element.name) + 's'}")
    private List<{source_name}> {field_name};"""
        
        elif relationship.relationship_type == 'one_to_one':
            if direction == 'source':
                target_name = self._to_pascal_case(relationship.target_element.name)
                field_name = self._to_camel_case(relationship.target_element.name)
                return f"""    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "{relationship.target_element.name.lower()}_id")
    private {target_name} {field_name};"""
            else:
                source_name = self._to_pascal_case(relationship.source_element.name)
                field_name = self._to_camel_case(relationship.source_element.name)
                return f"""    @OneToOne(mappedBy = "{self._to_camel_case(relationship.target_element.name)}")
    private {source_name} {field_name};"""
        
        return ""

    def _get_java_type(self, db_type: str) -> str:
        """Convert database type to Java type"""
        type_mapping = {
            'varchar': 'String',
            'text': 'String',
            'string': 'String',
            'integer': 'Integer',
            'int': 'Integer',
            'bigint': 'Long',
            'decimal': 'BigDecimal',
            'float': 'Double',
            'double': 'Double',
            'boolean': 'Boolean',
            'date': 'LocalDate',
            'datetime': 'LocalDateTime',
            'timestamp': 'LocalDateTime',
            'json': 'String',
            'uuid': 'String',
            'email': 'String'
        }
        return type_mapping.get(db_type.lower(), 'String')

    def _get_id_type(self, element: DiagramElement) -> str:
        """Get ID type for entity"""
        id_attr = element.attributes.filter(
            name__iregex=r'^(id|.*_id)$'
        ).first()
        
        if id_attr:
            return self._get_java_type(id_attr.data_type)
        return 'Long'  # Default to Long

    def _is_id_field(self, attr: ElementAttribute) -> bool:
        """Check if attribute is an ID field"""
        return (
            attr.name.lower() in ['id'] or
            attr.name.lower().endswith('_id') or
            attr.constraints.get('primary_key', False)
        )

    def _to_pascal_case(self, name: str) -> str:
        """Convert to PascalCase"""
        return ''.join(word.capitalize() for word in name.replace('-', '_').split('_'))

    def _to_camel_case(self, name: str) -> str:
        """Convert to camelCase"""
        pascal = self._to_pascal_case(name)
        return pascal[0].lower() + pascal[1:] if pascal else ''


class DatabaseScriptGenerator:
    """Generator for database scripts from database diagrams"""
    
    def __init__(self, diagram: Diagram):
        self.diagram = diagram
    
    def generate_scripts(self, database_types: List[str], config: Dict[str, Any]) -> Dict[str, str]:
        """Generate database scripts for multiple database types"""
        scripts = {}
        
        for db_type in database_types:
            if db_type == 'postgresql':
                scripts[db_type] = self._generate_postgresql_script(config)
            elif db_type == 'mysql':
                scripts[db_type] = self._generate_mysql_script(config)
            elif db_type == 'sqlserver':
                scripts[db_type] = self._generate_sqlserver_script(config)
            elif db_type == 'sqlite':
                scripts[db_type] = self._generate_sqlite_script(config)
        
        return scripts
    
    def _generate_postgresql_script(self, config: Dict[str, Any]) -> str:
        """Generate PostgreSQL script"""
        schema_name = config.get('schema_name', 'public')
        include_constraints = config.get('include_constraints', True)
        include_indexes = config.get('include_indexes', True)
        
        script = f"-- PostgreSQL Database Script\n"
        script += f"-- Generated from UML Diagram: {self.diagram.name}\n"
        script += f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        if schema_name != 'public':
            script += f"-- Create schema\nCREATE SCHEMA IF NOT EXISTS {schema_name};\n"
            script += f"SET search_path TO {schema_name};\n\n"
        
        # Generate tables
        tables = self.diagram.elements.filter(element_type__in=['table'])
        for table in tables:
            script += self._generate_postgresql_table(table, include_constraints)
            script += "\n\n"
        
        # Generate foreign key constraints
        if include_constraints:
            script += "-- Foreign Key Constraints\n"
            relationships = self.diagram.relationships.filter(
                relationship_type__in=['foreign_key', 'one_to_many', 'one_to_one']
            )
            for rel in relationships:
                script += self._generate_postgresql_foreign_key(rel)
                script += "\n"
        
        # Generate indexes
        if include_indexes:
            script += "\n-- Indexes\n"
            for table in tables:
                indexes = self._generate_postgresql_indexes(table)
                script += indexes
        
        return script
    
    def _generate_mysql_script(self, config: Dict[str, Any]) -> str:
        """Generate MySQL script"""
        schema_name = config.get('schema_name', 'database_schema')
        include_constraints = config.get('include_constraints', True)
        include_indexes = config.get('include_indexes', True)
        
        script = f"-- MySQL Database Script\n"
        script += f"-- Generated from UML Diagram: {self.diagram.name}\n"
        script += f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        script += f"-- Create database\nCREATE DATABASE IF NOT EXISTS {schema_name};\n"
        script += f"USE {schema_name};\n\n"
        
        # Generate tables
        tables = self.diagram.elements.filter(element_type__in=['table'])
        for table in tables:
            script += self._generate_mysql_table(table, include_constraints)
            script += "\n\n"
        
        # Generate foreign key constraints
        if include_constraints:
            script += "-- Foreign Key Constraints\n"
            relationships = self.diagram.relationships.filter(
                relationship_type__in=['foreign_key', 'one_to_many', 'one_to_one']
            )
            for rel in relationships:
                script += self._generate_mysql_foreign_key(rel)
                script += "\n"
        
        # Generate indexes
        if include_indexes:
            script += "\n-- Indexes\n"
            for table in tables:
                indexes = self._generate_mysql_indexes(table)
                script += indexes
        
        return script
    
    def _generate_sqlserver_script(self, config: Dict[str, Any]) -> str:
        """Generate SQL Server script"""
        schema_name = config.get('schema_name', 'dbo')
        include_constraints = config.get('include_constraints', True)
        include_indexes = config.get('include_indexes', True)
        
        script = f"-- SQL Server Database Script\n"
        script += f"-- Generated from UML Diagram: {self.diagram.name}\n"
        script += f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        if schema_name != 'dbo':
            script += f"-- Create schema\nIF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '{schema_name}')\n"
            script += f"    EXEC('CREATE SCHEMA {schema_name}');\n"
            script += "GO\n\n"
        
        # Generate tables
        tables = self.diagram.elements.filter(element_type__in=['table'])
        for table in tables:
            script += self._generate_sqlserver_table(table, schema_name, include_constraints)
            script += "\nGO\n\n"
        
        # Generate foreign key constraints
        if include_constraints:
            script += "-- Foreign Key Constraints\n"
            relationships = self.diagram.relationships.filter(
                relationship_type__in=['foreign_key', 'one_to_many', 'one_to_one']
            )
            for rel in relationships:
                script += self._generate_sqlserver_foreign_key(rel, schema_name)
                script += "\nGO\n"
        
        # Generate indexes
        if include_indexes:
            script += "\n-- Indexes\n"
            for table in tables:
                indexes = self._generate_sqlserver_indexes(table, schema_name)
                script += indexes
        
        return script
    
    def _generate_sqlite_script(self, config: Dict[str, Any]) -> str:
        """Generate SQLite script"""
        include_constraints = config.get('include_constraints', True)
        include_indexes = config.get('include_indexes', True)
        
        script = f"-- SQLite Database Script\n"
        script += f"-- Generated from UML Diagram: {self.diagram.name}\n"
        script += f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        script += "-- Enable foreign key constraints\nPRAGMA foreign_keys = ON;\n\n"
        
        # Generate tables
        tables = self.diagram.elements.filter(element_type__in=['table'])
        for table in tables:
            script += self._generate_sqlite_table(table, include_constraints)
            script += "\n\n"
        
        # Generate indexes
        if include_indexes:
            script += "-- Indexes\n"
            for table in tables:
                indexes = self._generate_sqlite_indexes(table)
                script += indexes
        
        return script
    
    def _generate_postgresql_table(self, table: DiagramElement, include_constraints: bool) -> str:
        """Generate PostgreSQL table definition"""
        table_name = table.name.lower()
        script = f"CREATE TABLE {table_name} (\n"
        
        columns = []
        attributes = table.attributes.all().order_by('order')
        
        for attr in attributes:
            column_def = f"    {attr.name.lower()} {self._get_postgresql_type(attr)}"
            
            # Add constraints
            if not attr.constraints.get('nullable', True):
                column_def += " NOT NULL"
            
            if attr.constraints.get('unique', False):
                column_def += " UNIQUE"
            
            if attr.constraints.get('primary_key', False):
                column_def += " PRIMARY KEY"
            
            if 'default_value' in attr.constraints and attr.constraints['default_value']:
                column_def += f" DEFAULT {attr.constraints['default_value']}"
            
            columns.append(column_def)
        
        script += ",\n".join(columns)
        script += f"\n);"
        
        return script
    
    def _generate_mysql_table(self, table: DiagramElement, include_constraints: bool) -> str:
        """Generate MySQL table definition"""
        table_name = table.name.lower()
        script = f"CREATE TABLE {table_name} (\n"
        
        columns = []
        attributes = table.attributes.all().order_by('order')
        
        for attr in attributes:
            column_def = f"    {attr.name.lower()} {self._get_mysql_type(attr)}"
            
            # Add constraints
            if not attr.constraints.get('nullable', True):
                column_def += " NOT NULL"
            
            if attr.constraints.get('auto_increment', False):
                column_def += " AUTO_INCREMENT"
            
            if attr.constraints.get('unique', False):
                column_def += " UNIQUE"
            
            if 'default_value' in attr.constraints and attr.constraints['default_value']:
                column_def += f" DEFAULT {attr.constraints['default_value']}"
            
            columns.append(column_def)
        
        # Add primary key
        primary_keys = [attr.name.lower() for attr in attributes 
                       if attr.constraints.get('primary_key', False)]
        if primary_keys:
            columns.append(f"    PRIMARY KEY ({', '.join(primary_keys)})")
        
        script += ",\n".join(columns)
        script += f"\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
        
        return script
    
    def _generate_sqlserver_table(self, table: DiagramElement, schema_name: str, include_constraints: bool) -> str:
        """Generate SQL Server table definition"""
        table_name = f"{schema_name}.{table.name}"
        script = f"CREATE TABLE {table_name} (\n"
        
        columns = []
        attributes = table.attributes.all().order_by('order')
        
        for attr in attributes:
            column_def = f"    {attr.name} {self._get_sqlserver_type(attr)}"
            
            # Add identity for auto-increment
            if attr.constraints.get('auto_increment', False):
                column_def += " IDENTITY(1,1)"
            
            # Add constraints
            if not attr.constraints.get('nullable', True):
                column_def += " NOT NULL"
            
            if attr.constraints.get('primary_key', False):
                column_def += " PRIMARY KEY"
            
            if attr.constraints.get('unique', False):
                column_def += " UNIQUE"
            
            if 'default_value' in attr.constraints and attr.constraints['default_value']:
                column_def += f" DEFAULT {attr.constraints['default_value']}"
            
            columns.append(column_def)
        
        script += ",\n".join(columns)
        script += f"\n);"
        
        return script
    
    def _generate_sqlite_table(self, table: DiagramElement, include_constraints: bool) -> str:
        """Generate SQLite table definition"""
        table_name = table.name.lower()
        script = f"CREATE TABLE {table_name} (\n"
        
        columns = []
        attributes = table.attributes.all().order_by('order')
        
        for attr in attributes:
            column_def = f"    {attr.name.lower()} {self._get_sqlite_type(attr)}"
            
            # Add constraints
            if attr.constraints.get('primary_key', False):
                column_def += " PRIMARY KEY"
            
            if attr.constraints.get('auto_increment', False):
                column_def += " AUTOINCREMENT"
            
            if not attr.constraints.get('nullable', True):
                column_def += " NOT NULL"
            
            if attr.constraints.get('unique', False):
                column_def += " UNIQUE"
            
            if 'default_value' in attr.constraints and attr.constraints['default_value']:
                column_def += f" DEFAULT {attr.constraints['default_value']}"
            
            columns.append(column_def)
        
        # Add foreign key constraints
        if include_constraints:
            relationships = self.diagram.relationships.filter(
                source_element=table,
                relationship_type__in=['foreign_key', 'one_to_many', 'many_to_one']
            )
            for rel in relationships:
                fk_constraint = f"    FOREIGN KEY ({rel.source_role or 'id'}) REFERENCES {rel.target_element.name.lower()}({rel.target_role or 'id'})"
                columns.append(fk_constraint)
        
        script += ",\n".join(columns)
        script += f"\n);"
        
        return script
    
    # Database type mapping methods
    def _get_postgresql_type(self, attr: ElementAttribute) -> str:
        """Get PostgreSQL data type"""
        type_map = {
            'varchar': lambda a: f"VARCHAR({a.constraints.get('max_length', 255)})",
            'text': 'TEXT',
            'integer': 'INTEGER',
            'bigint': 'BIGINT',
            'decimal': lambda a: f"DECIMAL({a.constraints.get('precision', 10)}, {a.constraints.get('scale', 2)})",
            'float': 'REAL',
            'double': 'DOUBLE PRECISION',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'datetime': 'TIMESTAMP',
            'timestamp': 'TIMESTAMP',
            'json': 'JSONB',
            'uuid': 'UUID'
        }
        
        data_type = attr.data_type.lower()
        if data_type in type_map:
            type_def = type_map[data_type]
            return type_def(attr) if callable(type_def) else type_def
        return 'VARCHAR(255)'
    
    def _get_mysql_type(self, attr: ElementAttribute) -> str:
        """Get MySQL data type"""
        type_map = {
            'varchar': lambda a: f"VARCHAR({a.constraints.get('max_length', 255)})",
            'text': 'TEXT',
            'integer': 'INT',
            'bigint': 'BIGINT',
            'decimal': lambda a: f"DECIMAL({a.constraints.get('precision', 10)}, {a.constraints.get('scale', 2)})",
            'float': 'FLOAT',
            'double': 'DOUBLE',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'datetime': 'DATETIME',
            'timestamp': 'TIMESTAMP',
            'json': 'JSON',
            'uuid': 'CHAR(36)'
        }
        
        data_type = attr.data_type.lower()
        if data_type in type_map:
            type_def = type_map[data_type]
            return type_def(attr) if callable(type_def) else type_def
        return 'VARCHAR(255)'
    
    def _get_sqlserver_type(self, attr: ElementAttribute) -> str:
        """Get SQL Server data type"""
        type_map = {
            'varchar': lambda a: f"NVARCHAR({a.constraints.get('max_length', 255)})",
            'text': 'NTEXT',
            'integer': 'INT',
            'bigint': 'BIGINT',
            'decimal': lambda a: f"DECIMAL({a.constraints.get('precision', 10)}, {a.constraints.get('scale', 2)})",
            'float': 'FLOAT',
            'double': 'FLOAT',
            'boolean': 'BIT',
            'date': 'DATE',
            'datetime': 'DATETIME2',
            'timestamp': 'DATETIME2',
            'json': 'NVARCHAR(MAX)',
            'uuid': 'UNIQUEIDENTIFIER'
        }
        
        data_type = attr.data_type.lower()
        if data_type in type_map:
            type_def = type_map[data_type]
            return type_def(attr) if callable(type_def) else type_def
        return 'NVARCHAR(255)'
    
    def _get_sqlite_type(self, attr: ElementAttribute) -> str:
        """Get SQLite data type"""
        type_map = {
            'varchar': 'TEXT',
            'text': 'TEXT',
            'integer': 'INTEGER',
            'bigint': 'INTEGER',
            'decimal': 'REAL',
            'float': 'REAL',
            'double': 'REAL',
            'boolean': 'INTEGER',
            'date': 'TEXT',
            'datetime': 'TEXT',
            'timestamp': 'TEXT',
            'json': 'TEXT',
            'uuid': 'TEXT'
        }
        
        data_type = attr.data_type.lower()
        return type_map.get(data_type, 'TEXT')
    
    def _generate_postgresql_foreign_key(self, rel: DiagramRelationship) -> str:
        """Generate PostgreSQL foreign key constraint"""
        source_table = rel.source_element.name.lower()
        target_table = rel.target_element.name.lower()
        source_column = rel.source_role or f"{target_table}_id"
        target_column = rel.target_role or "id"
        
        constraint_name = f"fk_{source_table}_{target_table}"
        
        return f"ALTER TABLE {source_table} ADD CONSTRAINT {constraint_name} " \
               f"FOREIGN KEY ({source_column}) REFERENCES {target_table}({target_column});"
    
    def _generate_mysql_foreign_key(self, rel: DiagramRelationship) -> str:
        """Generate MySQL foreign key constraint"""
        source_table = rel.source_element.name.lower()
        target_table = rel.target_element.name.lower()
        source_column = rel.source_role or f"{target_table}_id"
        target_column = rel.target_role or "id"
        
        constraint_name = f"fk_{source_table}_{target_table}"
        
        return f"ALTER TABLE {source_table} ADD CONSTRAINT {constraint_name} " \
               f"FOREIGN KEY ({source_column}) REFERENCES {target_table}({target_column});"
    
    def _generate_sqlserver_foreign_key(self, rel: DiagramRelationship, schema_name: str) -> str:
        """Generate SQL Server foreign key constraint"""
        source_table = f"{schema_name}.{rel.source_element.name}"
        target_table = f"{schema_name}.{rel.target_element.name}"
        source_column = rel.source_role or f"{rel.target_element.name.lower()}_id"
        target_column = rel.target_role or "id"
        
        constraint_name = f"FK_{rel.source_element.name}_{rel.target_element.name}"
        
        return f"ALTER TABLE {source_table} ADD CONSTRAINT {constraint_name} " \
               f"FOREIGN KEY ({source_column}) REFERENCES {target_table}({target_column});"
    
    def _generate_postgresql_indexes(self, table: DiagramElement) -> str:
        """Generate PostgreSQL indexes"""
        indexes = ""
        table_name = table.name.lower()
        
        # Create indexes for foreign key columns
        relationships = self.diagram.relationships.filter(source_element=table)
        for rel in relationships:
            if rel.relationship_type in ['foreign_key', 'one_to_many', 'many_to_one']:
                column_name = rel.source_role or f"{rel.target_element.name.lower()}_id"
                index_name = f"idx_{table_name}_{column_name}"
                indexes += f"CREATE INDEX {index_name} ON {table_name}({column_name});\n"
        
        return indexes
    
    def _generate_mysql_indexes(self, table: DiagramElement) -> str:
        """Generate MySQL indexes"""
        indexes = ""
        table_name = table.name.lower()
        
        # Create indexes for foreign key columns
        relationships = self.diagram.relationships.filter(source_element=table)
        for rel in relationships:
            if rel.relationship_type in ['foreign_key', 'one_to_many', 'many_to_one']:
                column_name = rel.source_role or f"{rel.target_element.name.lower()}_id"
                index_name = f"idx_{table_name}_{column_name}"
                indexes += f"CREATE INDEX {index_name} ON {table_name}({column_name});\n"
        
        return indexes
    
    def _generate_sqlserver_indexes(self, table: DiagramElement, schema_name: str) -> str:
        """Generate SQL Server indexes"""
        indexes = ""
        table_name = f"{schema_name}.{table.name}"
        
        # Create indexes for foreign key columns
        relationships = self.diagram.relationships.filter(source_element=table)
        for rel in relationships:
            if rel.relationship_type in ['foreign_key', 'one_to_many', 'many_to_one']:
                column_name = rel.source_role or f"{rel.target_element.name.lower()}_id"
                index_name = f"IX_{table.name}_{column_name}"
                indexes += f"CREATE INDEX {index_name} ON {table_name}({column_name});\nGO\n"
        
        return indexes
    
    def _generate_sqlite_indexes(self, table: DiagramElement) -> str:
        """Generate SQLite indexes"""
        indexes = ""
        table_name = table.name.lower()
        
        # Create indexes for foreign key columns
        relationships = self.diagram.relationships.filter(source_element=table)
        for rel in relationships:
            if rel.relationship_type in ['foreign_key', 'one_to_many', 'many_to_one']:
                column_name = rel.source_role or f"{rel.target_element.name.lower()}_id"
                index_name = f"idx_{table_name}_{column_name}"
                indexes += f"CREATE INDEX {index_name} ON {table_name}({column_name});\n"
        
        return indexes


class CodeGenerationService:
    """Main service for code generation operations"""
    
    @staticmethod
    def create_zip_file(files: List[Dict[str, Any]], project_name: str) -> str:
        """Create ZIP file from generated files"""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
            with zipfile.ZipFile(tmp_file, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_info in files:
                    file_path = file_info['file_path']
                    file_name = file_info['file_name']
                    content = file_info['content']
                    
                    # Create full path within project directory
                    if file_path:
                        full_path = f"{project_name}/{file_path}/{file_name}"
                    else:
                        full_path = f"{project_name}/{file_name}"
                    
                    zip_file.writestr(full_path, content)
            
            return tmp_file.name
