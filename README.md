# UML Diagrams - Collaborative Diagram Editor

Una aplicación web colaborativa para crear y editar diagramas UML en tiempo real, construida con Django (backend) y React (frontend).

## 🌟 Características

- **Editor de diagramas UML** interactivo y responsive
- **Colaboración en tiempo real** con WebSockets
- **Base de datos** para persistencia de proyectos y diagramas
- **Autenticación** con Google OAuth
- **Generación de código** automática desde diagramas
- **Export/Import** de diagramas
- **API REST** completa

## 🛠️ Stack Tecnológico

### Backend
- **Django 4.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos
- **Redis** - Cache y WebSockets
- **Channels** - WebSockets para tiempo real

### Frontend
- **React 19** - UI Framework
- **Vite** - Build tool
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **@xyflow/react** - Editor de diagramas
- **Material-UI** - Componentes UI

### Cloud & DevOps
- **Google Cloud Platform**
  - App Engine (hosting)
  - Cloud SQL (base de datos)
  - Cloud Storage (archivos estáticos)
  - Memorystore Redis (cache)
- **GitHub Actions** - CI/CD
- **Docker** - Containerización

## 🚀 Quick Start

### Prerrequisitos
- Python 3.9+
- Node.js 18+
- Git

### Desarrollo Local

1. **Clonar repositorio**
   ```bash
   git clone https://github.com/Vit537/proyecto_diagrama.git
   cd proyecto_diagrama
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env  # Editar con tus valores
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd editor/my-project
   npm install
   cp .env.example .env  # Editar con tus valores
   npm run dev
   ```

4. **Acceder a la aplicación**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## 🌐 Deployment a Producción

### Opción 1: GitHub Actions (Recomendado)
1. Sube el código a GitHub
2. Configura los secrets en GitHub (ver `GITHUB_DEPLOYMENT.md`)
3. Haz push a `main` - deployment automático

### Opción 2: Deployment Manual
1. Revisa `DEPLOYMENT_GUIDE.md` para instrucciones detalladas
2. Ejecuta `./deploy.sh` (Linux/Mac) o `deploy.bat` (Windows)

## 📚 Documentación

- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Guía completa de deployment
- [`GITHUB_DEPLOYMENT.md`](GITHUB_DEPLOYMENT.md) - Deployment con GitHub Actions
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Checklist rápido
- [`DATABASE_SETUP.md`](DATABASE_SETUP.md) - Configuración de base de datos
- [`STORAGE_SETUP.md`](STORAGE_SETUP.md) - Configuración de almacenamiento

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │────│   Django API    │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         └──────────────│      Redis      │─────────────┘
                        │   (WebSockets)  │
                        └─────────────────┘
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno

#### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=UML Diagrams
VITE_ENVIRONMENT=development
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd editor/my-project
npm run test
```

### Linting
```bash
# Backend
cd backend
flake8 .

# Frontend
cd editor/my-project
npm run lint
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: Vit537
- **Repositorio**: https://github.com/Vit537/proyecto_diagrama

## 🆘 Soporte

- **Issues**: https://github.com/Vit537/proyecto_diagrama/issues
- **Documentación**: Ver archivos MD en la raíz del proyecto
- **Wiki**: https://github.com/Vit537/proyecto_diagrama/wiki

---

⭐ **¡Si te gusta el proyecto, dale una estrella en GitHub!** ⭐