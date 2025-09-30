# 🚀 Guía Completa: Deployment en Render + Vercel

Esta guía te llevará paso a paso para desplegar tu aplicación UML Diagrams usando:
- **Render** para el backend Django (con PostgreSQL incluido)
- **Vercel** para el frontend React

## 📋 Prerrequisitos

- Cuenta en [Render](https://render.com) (gratuita)
- Cuenta en [Vercel](https://vercel.com) (gratuita)
- Código subido a GitHub
- 30 minutos de tu tiempo

---

## 🎯 PARTE 1: Desplegar Backend en Render

### Paso 1: Crear cuenta y conectar GitHub

1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub
3. Autoriza a Render para acceder a tus repositorios

### Paso 2: Crear el Web Service

1. **Crear nuevo servicio**:
   - Click en "New +"
   - Selecciona "Web Service"
   - Conecta tu repositorio `proyecto_diagrama`

2. **Configuración básica**:
   ```
   Name: uml-diagrams-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: ./build.sh
   Start Command: gunicorn uml_diagrams_backend.wsgi:application
   ```

3. **Plan de servicio**:
   - Selecciona "Free" (0$/mes) para pruebas
   - O "Starter" (7$/mes) para mejor rendimiento

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", agrega:

| Variable | Valor |
|----------|-------|
| `DJANGO_SETTINGS_MODULE` | `uml_diagrams_backend.settings_render` |
| `DEBUG` | `False` |
| `SECRET_KEY` | `tu-clave-super-secreta-django` |
| `CORS_ALLOWED_ORIGINS` | `https://tu-vercel-app.vercel.app` |
| `ALLOWED_HOSTS` | `tu-render-app.onrender.com` |
| `SECURE_SSL_REDIRECT` | `True` |

**⚠️ Importante**: Guarda la URL de tu servicio Render, la necesitarás para el frontend.

### Paso 4: Crear Base de Datos PostgreSQL

1. **Crear PostgreSQL**:
   - Click en "New +"
   - Selecciona "PostgreSQL"
   - Nombre: `uml-diagrams-postgres`
   - Plan: "Free" (0$/mes)

2. **Conectar a tu Web Service**:
   - Ve a tu Web Service
   - En "Environment Variables", Render agregará automáticamente:
     - `DATABASE_URL` (conexión completa a PostgreSQL)

### Paso 5: Deploy y Verificar

1. **Hacer Deploy**:
   - Render automáticamente hará el build y deploy
   - Monitorea los logs en tiempo real

2. **Verificar funcionamiento**:
   - Ve a la URL de tu servicio (ej: `https://uml-diagrams-backend.onrender.com`)
   - Deberías ver la página de Django o API

3. **Acceder al Admin** (opcional):
   - Ve a `https://tu-render-app.onrender.com/admin/`
   - Necesitarás crear un superusuario (ver sección de troubleshooting)

---

## 🎨 PARTE 2: Desplegar Frontend en Vercel

### Paso 1: Preparar el Frontend

1. **Actualizar variables de entorno**:
   - Edita `editor/my-project/.env.production`
   - Cambia `VITE_API_BASE_URL` por tu URL de Render:
   ```env
   VITE_API_BASE_URL=https://tu-render-app.onrender.com
   VITE_APP_NAME=UML Diagrams
   VITE_ENVIRONMENT=production
   ```

2. **Commit y push** los cambios:
   ```bash
   git add .
   git commit -m "Update API URL for Render backend"
   git push origin main
   ```

### Paso 2: Desplegar en Vercel

1. **Crear cuenta y conectar GitHub**:
   - Ve a [vercel.com](https://vercel.com)
   - Regístrate con GitHub
   - Importa tu repositorio `proyecto_diagrama`

2. **Configuración del proyecto**:
   ```
   Framework Preset: Vite
   Root Directory: editor/my-project
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Variables de entorno en Vercel**:
   - Ve a Settings → Environment Variables
   - Agrega:
   ```
   VITE_API_BASE_URL = https://tu-render-app.onrender.com
   VITE_APP_NAME = UML Diagrams
   VITE_ENVIRONMENT = production
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel automáticamente construirá y desplegará tu app

### Paso 3: Configurar CORS en Backend

1. **Actualizar CORS en Render**:
   - Ve a tu Web Service en Render
   - En Environment Variables, actualiza:
   ```
   CORS_ALLOWED_ORIGINS = https://tu-vercel-app.vercel.app
   ```
   - (Reemplaza `tu-vercel-app` con tu URL real de Vercel)

2. **Redeployment automático**:
   - Render automáticamente redesplegará con los nuevos valores

---

## ✅ PARTE 3: Verificación Final

### Paso 1: Probar la Aplicación

1. **Frontend**: Ve a tu URL de Vercel
2. **Funcionalidades a probar**:
   - ✅ La página se carga correctamente
   - ✅ No hay errores de CORS en la consola
   - ✅ Puedes registrarte/iniciar sesión
   - ✅ Puedes crear proyectos y diagramas
   - ✅ Las peticiones a la API funcionan

### Paso 2: Monitoreo

1. **Logs de Render**:
   - Ve a tu Web Service → Logs
   - Monitorea errores en tiempo real

2. **Logs de Vercel**:
   - Ve a tu proyecto → Functions → View Function Logs
   - Revisa errores de build o runtime

---

## 🛠️ Troubleshooting

### Problema: Error de CORS
**Síntoma**: "CORS policy" en consola del navegador
**Solución**:
1. Verifica que `CORS_ALLOWED_ORIGINS` en Render incluya tu URL de Vercel
2. Asegúrate de que no hay espacios extra en las URLs

### Problema: Base de datos vacía
**Síntoma**: Error 500 o tablas no existen
**Solución**: Crear superusuario y ejecutar migraciones
```bash
# Desde el shell de Render (en el dashboard)
python manage.py createsuperuser
```

### Problema: Archivos estáticos no cargan
**Síntoma**: CSS/JS no se cargan, página sin estilos
**Solución**: Verificar `STATIC_URL` y `STATICFILES_STORAGE` en settings

### Problema: Build falla en Vercel
**Síntoma**: "Build failed" en Vercel
**Solución**:
1. Verificar que `vercel.json` esté en la carpeta correcta
2. Revisar que las dependencias en `package.json` estén correctas

### Problema: Variables de entorno no funcionan
**Síntoma**: Aplicación usa valores por defecto
**Solución**:
1. Verificar que las variables estén en el environment correcto
2. Redeploy después de cambiar variables

---

## 💰 Costos

### Plan Gratuito (Perfecto para empezar)
- **Render Free**: $0/mes
  - 750 horas/mes (suficiente para uso personal)
  - Se "duerme" después de 15 min de inactividad
  - PostgreSQL incluido gratis

- **Vercel Hobby**: $0/mes
  - Deploys ilimitados
  - 100GB bandwidth/mes
  - Funciones serverless incluidas

**Total: $0/mes** 🎉

### Plan Pagado (Para producción)
- **Render Starter**: $7/mes
  - Siempre activo (no se duerme)
  - Mejor performance

- **Vercel Pro**: $20/mes
  - Más bandwidth y features avanzadas

**Total: $27/mes**

---

## 🚀 Automatización Futura

### GitHub Actions (Opcional)
Puedes configurar deployment automático:
1. Cada push a `main` → auto-deploy en ambas plataformas
2. Pull requests → preview deployments
3. Tests automáticos antes del deploy

---

## 📞 Soporte

### URLs Importantes
- **Tu Frontend**: `https://tu-vercel-app.vercel.app`
- **Tu Backend**: `https://tu-render-app.onrender.com`
- **Admin Panel**: `https://tu-render-app.onrender.com/admin/`

### Recursos
- [Documentación Render](https://render.com/docs)
- [Documentación Vercel](https://vercel.com/docs)
- [Documentación Django en Render](https://render.com/docs/deploy-django)

---

¡Tu aplicación UML Diagrams está lista para producción! 🎊

**Próximos pasos recomendados**:
1. Configurar dominio personalizado
2. Configurar email transaccional
3. Implementar analytics
4. Configurar monitoring y alertas