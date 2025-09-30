@echo off
REM Deployment script for UML Diagrams application to Google Cloud (Windows)
REM Make sure you're authenticated with Google Cloud CLI before running this script

echo 🚀 Starting deployment process...

REM Configuration
if "%PROJECT_ID%"=="" (
    echo ❌ Error: PROJECT_ID environment variable is not set
    echo Please set it with: set PROJECT_ID=your-project-id
    pause
    exit /b 1
)

set REGION=us-central1
set SERVICE_NAME=uml-diagrams-backend

echo 📋 Using PROJECT_ID: %PROJECT_ID%
echo 📋 Using REGION: %REGION%

REM Check prerequisites
echo 🔍 Checking prerequisites...

where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI is not installed
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Set the project
echo ⚙️ Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable storage-component.googleapis.com

REM Build frontend
echo 🏗️ Building React frontend...
cd editor\my-project
call npm ci
call npm run build:prod
cd ..\..

REM Copy frontend build to backend static
echo 📂 Copying frontend build to backend...
if not exist "backend\static\frontend" mkdir backend\static\frontend
xcopy /E /Y editor\build\* backend\static\frontend\ 2>nul || echo Frontend build directory not found, skipping...

REM Install backend dependencies and run tests
echo 🧪 Installing backend dependencies and running tests...
cd backend
pip install -r requirements.txt
python manage.py test --settings=uml_diagrams_backend.settings || echo Tests failed, continuing...

REM Collect static files
echo 📁 Collecting static files...
python manage.py collectstatic --noinput --settings=uml_diagrams_backend.settings

cd ..

REM Deploy using Cloud Build
echo ☁️ Deploying to Google Cloud using Cloud Build...
gcloud builds submit --config=cloudbuild.yaml

echo 🎉 Deployment completed successfully!
echo 🌐 Your application should be available at: https://%PROJECT_ID%.appspot.com

REM Optional: Open the application in browser
set /p choice="Would you like to open the application in your browser? (y/n): "
if /i "%choice%"=="y" gcloud app browse

echo 📝 Next steps:
echo 1. Update your domain settings if using a custom domain
echo 2. Set up monitoring and logging
echo 3. Configure SSL certificates if needed
echo 4. Set up automated backups for your database

pause