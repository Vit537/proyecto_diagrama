# UML Diagrams - Deployment con GitHub Actions

## 🚀 Deployment Automático desde GitHub

Tu proyecto está configurado para deployment automático usando GitHub Actions. Cada vez que hagas push a la rama `main`, se desplegará automáticamente a Google Cloud.

## 📋 Configuración en GitHub

### 1. Sube tu código a GitHub
```bash
git add .
git commit -m "Initial commit with production configuration"
git push origin main
```

### 2. Configura GitHub Secrets

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions

Agrega estos secrets:

#### 🔐 Secrets requeridos:

| Secret Name | Descripción | Ejemplo |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | ID de tu proyecto Google Cloud | `mi-proyecto-123` |
| `GCP_SA_KEY` | JSON del Service Account | `{"type": "service_account"...}` |
| `DB_NAME` | Nombre de la base de datos | `umldiagrams` |
| `DB_USER` | Usuario de la base de datos | `umluser` |
| `DB_PASSWORD` | Contraseña de la base de datos | `mi-password-seguro` |
| `DB_HOST` | Host de Cloud SQL | `/cloudsql/proyecto:region:instancia` |
| `GS_BUCKET_NAME` | Nombre del bucket de Storage | `mi-bucket-storage` |
| `REDIS_URL` | URL de Redis/Memorystore | `redis://10.0.0.3:6379` |
| `CORS_ALLOWED_ORIGINS` | Dominios permitidos | `https://mi-dominio.com,https://proyecto.appspot.com` |
| `EMAIL_HOST_USER` | Email para envío | `noreply@midominio.com` |
| `EMAIL_HOST_PASSWORD` | Contraseña del email | `mi-app-password` |
| `GOOGLE_OAUTH2_CLIENT_ID` | Client ID de Google OAuth | `123456.apps.googleusercontent.com` |
| `GOOGLE_OAUTH2_CLIENT_SECRET` | Secret de Google OAuth | `GOCSPX-abc123` |
| `JWT_SECRET_KEY` | Clave secreta para JWT | `mi-jwt-secret-super-seguro` |
| `SECRET_KEY` | Clave secreta de Django | `mi-django-secret-super-seguro` |

### 3. Crear Service Account en Google Cloud

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions"

# Asignar permisos
gcloud projects add-iam-policy-binding tu-project-id \
    --member="serviceAccount:github-actions@tu-project-id.iam.gserviceaccount.com" \
    --role="roles/appengine.appAdmin"

gcloud projects add-iam-policy-binding tu-project-id \
    --member="serviceAccount:github-actions@tu-project-id.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding tu-project-id \
    --member="serviceAccount:github-actions@tu-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Crear y descargar la clave
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@tu-project-id.iam.gserviceaccount.com
```

Copia el contenido completo del archivo `github-actions-key.json` y pégalo en el secret `GCP_SA_KEY`.

## 🔄 Workflow de Deployment

### Automático
- **Push a `main`**: Despliega automáticamente a producción
- **Pull Request**: Solo ejecuta tests, no despliega
- **Manual**: Puedes disparar el deployment manualmente desde GitHub Actions

### Manual desde GitHub
1. Ve a tu repositorio → Actions
2. Selecciona "Deploy to Google Cloud"
3. Click "Run workflow"
4. Selecciona la rama y ejecuta

## 📊 Monitoreo del Deployment

### En GitHub
- Ve a Actions para ver el progreso
- Los logs de cada paso están disponibles
- Recibirás notificaciones si falla

### En Google Cloud
```bash
# Ver logs de la aplicación
gcloud app logs tail -s default

# Ver el estado
gcloud app describe
```

## 🛠️ Desarrollo Local vs Producción

### Para desarrollo local:
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py runserver

# Frontend
cd editor/my-project
npm install
npm run dev
```

### Para producción:
```bash
# Solo hacer push a main
git add .
git commit -m "My changes"
git push origin main
```

## 🔧 Configuración de Ramas

### Estrategia recomendada:
- `main`: Producción (auto-deploy)
- `develop`: Desarrollo (solo tests)
- `feature/*`: Features nuevas

### Para cambiar la rama de deployment:
Edita `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ main ]  # Cambia por tu rama preferida
```

## 🚨 Troubleshooting

### Error: "Service account not found"
- Verifica que creaste el service account
- Confirma que el JSON está completo en `GCP_SA_KEY`

### Error: "Permission denied"
- Revisa los roles del service account
- Asegúrate que App Engine esté habilitado

### Error: "Database connection failed"
- Verifica los secrets de la base de datos
- Confirma que Cloud SQL esté corriendo

### Error: "Static files not loading"
- Verifica el bucket de Cloud Storage
- Confirma permisos del bucket

## 📝 Comandos Útiles

### Ver el deployment en tiempo real:
```bash
# Desde tu terminal local
gcloud app logs tail -s default --project=tu-project-id
```

### Rollback si algo sale mal:
```bash
# Ver versiones
gcloud app versions list

# Hacer rollback
gcloud app services set-traffic default --splits [PREVIOUS_VERSION]=100
```

### Gestionar traffic split:
```bash
# 50% old version, 50% new version
gcloud app services set-traffic default --splits v1=50,v2=50
```

## 🎯 Beneficios del GitHub Actions

✅ **Deployment automático** - Solo haz push y listo  
✅ **Tests automáticos** - Previene deployment con errores  
✅ **Rollback fácil** - Desde Google Cloud Console  
✅ **Historial completo** - Ve todos los deployments  
✅ **Notificaciones** - Email/Slack cuando falla  
✅ **Seguridad** - Secrets encriptados  

---

¡Tu proyecto está listo para production-grade deployment! 🚀