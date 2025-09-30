# ⚡ Quick Start: Render + Vercel Deployment

## 🎯 Pasos Rápidos (15 minutos)

### Backend en Render
1. **Render.com** → New + → Web Service
2. **Conectar repo** → `proyecto_diagrama`
3. **Configurar**:
   - Root Directory: `backend`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn uml_diagrams_backend.wsgi:application`
4. **Variables de entorno**:
   ```
   DJANGO_SETTINGS_MODULE=uml_diagrams_backend.settings_render
   DEBUG=False
   SECRET_KEY=tu-clave-secreta
   ```
5. **PostgreSQL** → New + → PostgreSQL → Free plan
6. **Deploy** automáticamente

### Frontend en Vercel
1. **Vercel.com** → Import Project
2. **Configurar**:
   - Root Directory: `editor/my-project`
   - Framework: Vite
3. **Variables de entorno**:
   ```
   VITE_API_BASE_URL=https://tu-render-app.onrender.com
   ```
4. **Deploy** automáticamente

### Conectar ambos
1. **Actualizar CORS** en Render:
   ```
   CORS_ALLOWED_ORIGINS=https://tu-vercel-app.vercel.app
   ```

## ✅ Checklist de Verificación

### Pre-deployment
- [ ] Código subido a GitHub
- [ ] Cuentas creadas en Render y Vercel
- [ ] Variables de entorno preparadas

### Backend (Render)
- [ ] Web Service creado
- [ ] PostgreSQL creado y conectado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] API accesible en `https://tu-app.onrender.com`

### Frontend (Vercel)
- [ ] Proyecto importado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] App accesible en `https://tu-app.vercel.app`

### Integración
- [ ] CORS configurado correctamente
- [ ] Frontend puede hacer peticiones al backend
- [ ] No hay errores en consola del navegador
- [ ] Funcionalidades básicas funcionan

## 🚨 Errores Comunes

| Error | Solución |
|-------|----------|
| CORS error | Verificar `CORS_ALLOWED_ORIGINS` en Render |
| Build falla | Revisar `build.sh` tiene permisos de ejecución |
| 500 error | Revisar logs en Render dashboard |
| Variables no funcionan | Redeploy después de cambiar variables |

## 📱 URLs después del deployment

- **Frontend**: `https://[tu-proyecto].vercel.app`
- **Backend**: `https://[tu-servicio].onrender.com`
- **Admin**: `https://[tu-servicio].onrender.com/admin/`

---

¡En 15 minutos tendrás tu app funcionando! 🚀