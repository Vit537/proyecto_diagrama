# UML Diagrams - Production Deployment Guide

Este proyecto está configurado para ser desplegado en Google Cloud Platform usando App Engine, Cloud SQL, y Cloud Storage.

## 📋 Prerrequisitos

### 1. Herramientas necesarias
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Python](https://www.python.org/) (versión 3.9 o superior)
- Git

### 2. Cuenta de Google Cloud
- Cuenta activa en Google Cloud Platform
- Proyecto creado en GCP
- Facturación habilitada para el proyecto

## 🚀 Proceso de Despliegue

### Paso 1: Configuración inicial

1. **Clonar el repositorio y navegar al directorio**
   ```bash
   git clone <tu-repositorio>
   cd proyecto_diagrama
   ```

2. **Autenticarse con Google Cloud**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Configurar variables de entorno**
   ```bash
   export PROJECT_ID=tu-project-id
   export REGION=us-central1
   ```

### Paso 2: Configurar servicios de Google Cloud

1. **Crear base de datos Cloud SQL**
   ```bash
   gcloud sql instances create uml-diagrams-db \
       --database-version=POSTGRES_14 \
       --tier=db-f1-micro \
       --region=us-central1 \
       --root-password=your-secure-password

   gcloud sql databases create umldiagrams --instance=uml-diagrams-db
   gcloud sql users create umluser --instance=uml-diagrams-db --password=your-user-password
   ```

2. **Crear bucket de Cloud Storage**
   ```bash
   gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://tu-bucket-name
   gsutil iam ch allUsers:objectViewer gs://tu-bucket-name
   ```

3. **Configurar Redis (Memorystore)**
   ```bash
   gcloud redis instances create uml-diagrams-redis \
       --size=1 \
       --region=$REGION \
       --redis-version=redis_6_x
   ```

### Paso 3: Actualizar configuración

1. **Editar `backend/app.yaml`** con tus valores específicos:
   ```yaml
   env_variables:
     DB_NAME: "umldiagrams"
     DB_USER: "umluser"
     DB_PASSWORD: "your-user-password"
     DB_HOST: "/cloudsql/tu-project-id:us-central1:uml-diagrams-db"
     GS_BUCKET_NAME: "tu-bucket-name"
     GS_PROJECT_ID: "tu-project-id"
     # ... otros valores
   ```

2. **Crear archivo `.env` para el frontend**
   ```bash
   cd editor/my-project
   cp .env.example .env
   ```
   
   Editar `.env`:
   ```
   VITE_API_BASE_URL=https://tu-project-id.appspot.com
   VITE_APP_NAME=UML Diagrams
   VITE_ENVIRONMENT=production
   ```

### Paso 4: Desplegar

#### Opción A: Usando el script automático
```bash
# En Windows
deploy.bat

# En Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

#### Opción B: Despliegue manual
```bash
# 1. Construir frontend
cd editor/my-project
npm ci
npm run build:prod
cd ../..

# 2. Copiar archivos del frontend
mkdir -p backend/static/frontend
cp -r editor/build/* backend/static/frontend/

# 3. Instalar dependencias del backend
cd backend
pip install -r requirements.txt

# 4. Ejecutar tests
python manage.py test

# 5. Recopilar archivos estáticos
python manage.py collectstatic --noinput

# 6. Desplegar
cd ..
gcloud builds submit --config=cloudbuild.yaml
```

### Paso 5: Configuración post-despliegue

1. **Ejecutar migraciones**
   ```bash
   gcloud app deploy backend/migrate.yaml
   ```

2. **Crear superusuario**
   ```bash
   gcloud app versions list
   # Usar Cloud Shell para conectarse y crear superuser
   ```

## 🔧 Configuraciones adicionales

### Variables de entorno importantes

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PROJECT_ID` | ID del proyecto de GCP | `mi-proyecto-123` |
| `DB_NAME` | Nombre de la base de datos | `umldiagrams` |
| `DB_USER` | Usuario de la base de datos | `umluser` |
| `DB_PASSWORD` | Contraseña de la base de datos | `contraseña-segura` |
| `GS_BUCKET_NAME` | Nombre del bucket de almacenamiento | `mi-bucket-storage` |
| `SECRET_KEY` | Clave secreta de Django | `clave-super-secreta` |
| `GOOGLE_OAUTH2_CLIENT_ID` | ID del cliente OAuth de Google | `123456789.apps.googleusercontent.com` |

### Servicios de Google Cloud utilizados

- **App Engine**: Hosting de la aplicación web
- **Cloud SQL**: Base de datos PostgreSQL
- **Cloud Storage**: Almacenamiento de archivos estáticos y media
- **Cloud Build**: CI/CD para despliegue automático
- **Memorystore (Redis)**: Cache y WebSockets en tiempo real

## 🔍 Monitoreo y logs

- **Ver logs**: `gcloud app logs tail -s default`
- **Monitoreo**: Google Cloud Console > Monitoring
- **Errores**: Google Cloud Console > Error Reporting

## 🛠️ Solución de problemas comunes

### Error de conexión a la base de datos
- Verificar que Cloud SQL esté ejecutándose
- Confirmar las credenciales en `app.yaml`
- Revisar las reglas de firewall

### Archivos estáticos no cargan
- Verificar configuración de Cloud Storage
- Confirmar permisos del bucket
- Ejecutar `collectstatic` nuevamente

### Error de CORS
- Actualizar `CORS_ALLOWED_ORIGINS` en settings
- Verificar configuración del frontend

## 📝 Comandos útiles

```bash
# Ver estado de la aplicación
gcloud app describe

# Ver versiones desplegadas
gcloud app versions list

# Escalar la aplicación
gcloud app versions set-traffic [VERSION] --splits [VERSION]=1

# Ver logs en tiempo real
gcloud app logs tail -s default

# Ejecutar comandos de Django
gcloud app deploy backend/migrate.yaml
```

## 🔒 Seguridad

- Todas las comunicaciones son HTTPS
- Variables sensibles están en variables de entorno
- Base de datos con SSL habilitado
- Bucket de almacenamiento con permisos controlados

## 💰 Costos estimados

Para una aplicación pequeña a mediana:
- App Engine: $0-$50/mes
- Cloud SQL (f1-micro): ~$7/mes
- Cloud Storage: ~$1-5/mes
- Memorystore: ~$30/mes

**Total estimado**: $38-92/mes (dependiendo del uso)

---

¡Tu aplicación UML Diagrams está lista para producción! 🎉