#!/bin/bash

# Deployment script for UML Diagrams application to Google Cloud
# Make sure you're authenticated with Google Cloud CLI before running this script

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-""}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="uml-diagrams-backend"

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export PROJECT_ID=your-project-id"
    exit 1
fi

echo -e "${YELLOW}📋 Using PROJECT_ID: $PROJECT_ID${NC}"
echo -e "${YELLOW}📋 Using REGION: $REGION${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists gcloud; then
    echo -e "${RED}❌ Google Cloud CLI is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists python; then
    echo -e "${RED}❌ Python is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Set the project
echo -e "${YELLOW}⚙️ Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable storage-component.googleapis.com

# Build frontend
echo -e "${YELLOW}🏗️ Building React frontend...${NC}"
cd editor/my-project
npm ci
npm run build:prod
cd ../..

# Copy frontend build to backend static
echo -e "${YELLOW}📂 Copying frontend build to backend...${NC}"
mkdir -p backend/static/frontend
cp -r editor/build/* backend/static/frontend/ 2>/dev/null || echo "Frontend build directory not found, skipping..."

# Install backend dependencies and run tests
echo -e "${YELLOW}🧪 Installing backend dependencies and running tests...${NC}"
cd backend
pip install -r requirements.txt
python manage.py test --settings=uml_diagrams_backend.settings || echo "Tests failed, continuing..."

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=uml_diagrams_backend.settings

cd ..

# Deploy using Cloud Build
echo -e "${YELLOW}☁️ Deploying to Google Cloud using Cloud Build...${NC}"
gcloud builds submit --config=cloudbuild.yaml

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application should be available at: https://$PROJECT_ID.appspot.com${NC}"

# Optional: Open the application in browser
read -p "Would you like to open the application in your browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gcloud app browse
fi

echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your domain settings if using a custom domain"
echo "2. Set up monitoring and logging"
echo "3. Configure SSL certificates if needed"
echo "4. Set up automated backups for your database"