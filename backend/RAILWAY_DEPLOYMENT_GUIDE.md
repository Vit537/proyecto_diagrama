# 🚂 Guía de Deployment en Railway + Vercel

## 📋 **Configuración del Backend en Railway**

### **Paso 1: Preparar el Repositorio**
✅ Ya configurado - Los archivos necesarios ya están en tu repo:
- `railway.json` - Configuración de Railway
- `Procfile` - Comandos de inicio
- `runtime.txt` - Versión de Python
- `requirements.txt` - Dependencias optimizadas
- `settings_railway.py` - Configuración de producción

### **Paso 2: Crear Proyecto en Railway**

1. **Ir a Railway**: https://railway.app
2. **Registrarse/Iniciar sesión** con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Seleccionar** tu repositorio `proyecto_diagrama`
5. **Configurar el directorio**: Asegúrate de que apunte a la carpeta `/backend`

### **Paso 3: Configurar Variables de Entorno en Railway**

En el dashboard de Railway, ve a **Variables** y agrega:

```bash
# Django Configuration
DJANGO_SETTINGS_MODULE=uml_diagrams_backend.settings_railway
SECRET_KEY=tu-secret-key-super-segura-aqui
DEBUG=False

# Database (Railway creará esto automáticamente)
# DATABASE_URL se generará automáticamente cuando agregues PostgreSQL

# Frontend Connection
VERCEL_DOMAIN=tu-app.vercel.app
```

### **Paso 4: Agregar Base de Datos PostgreSQL**

1. En tu proyecto de Railway, click **New Service**
2. Seleccionar **PostgreSQL**
3. Railway creará automáticamente la variable `DATABASE_URL`

### **Paso 5: Deploy**

1. Railway detectará automáticamente los cambios
2. El build se ejecutará usando `railway.json`
3. Se ejecutarán las migraciones automáticamente
4. El servidor se iniciará con Gunicorn

---

## 🌐 **Configuración del Frontend en Vercel**

### **Paso 1: Configurar Variables de Entorno en Vercel**

En tu dashboard de Vercel, ve a **Settings** → **Environment Variables**:

```bash
# Backend Connection
VITE_API_URL=https://tu-app-railway.railway.app/api
VITE_WS_URL=wss://tu-app-railway.railway.app/ws
```

### **Paso 2: Actualizar configuración de Vercel**

El archivo `vercel.json` ya está configurado en `/editor/my-project/`

---

## 🔧 **Pasos para Completar el Deployment**

### **Railway (Backend)**:
1. Registrarse en Railway.app
2. Conectar repositorio GitHub
3. Configurar variables de entorno
4. Agregar PostgreSQL
5. Deploy automático

### **Vercel (Frontend)**:
1. Ya configurado anteriormente
2. Solo actualizar `VITE_API_URL` con la URL de Railway
3. Redeploy

---

## 🐛 **Troubleshooting**

### **Problemas Comunes en Railway**:
- **Build fails**: Verificar `requirements.txt` y `runtime.txt`
- **Database errors**: Asegurar que PostgreSQL esté agregado
- **Static files**: WhiteNoise está configurado automáticamente

### **Logs en Railway**:
- Ve a **Deployments** → **View Logs**
- Revisa tanto Build como Deploy logs

---

## 📱 **URLs Finales**

- **Backend API**: `https://tu-proyecto.railway.app/api/`
- **Admin Panel**: `https://tu-proyecto.railway.app/admin/`
- **Frontend**: `https://tu-proyecto.vercel.app/`

---

## 🔄 **Flujo de Desarrollo**

1. **Desarrollo local**: Usar SQLite y configuración local
2. **Push a GitHub**: Los cambios se despliegan automáticamente
3. **Railway**: Backend en producción con PostgreSQL
4. **Vercel**: Frontend conectado al backend de Railway

¡Railway es mucho más confiable que Render y el proceso es más sencillo! 🎉