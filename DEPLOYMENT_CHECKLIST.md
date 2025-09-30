# Quick Setup Checklist for Production Deployment

## Before Deployment

### ✅ 1. Google Cloud Setup
- [ ] Create Google Cloud Project
- [ ] Enable billing
- [ ] Install Google Cloud CLI
- [ ] Authenticate: `gcloud auth login`

### ✅ 2. Environment Configuration
- [ ] Copy `backend/.env.production.example` to `backend/.env` and fill values
- [ ] Copy `editor/my-project/.env.example` to `editor/my-project/.env.production`
- [ ] Update `backend/app.yaml` with your project-specific values

### ✅ 3. Database Setup
- [ ] Create Cloud SQL instance
- [ ] Create database and user
- [ ] Update database credentials in app.yaml

### ✅ 4. Storage Setup
- [ ] Create Cloud Storage bucket
- [ ] Set bucket permissions
- [ ] Update bucket name in app.yaml

### ✅ 5. Redis Setup (Optional but recommended)
- [ ] Create Memorystore Redis instance
- [ ] Update Redis URL in app.yaml

## Deployment Commands

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Deploy using the automated script
./deploy.sh  # Linux/Mac
# or
deploy.bat   # Windows
```

## Post-Deployment

### ✅ 1. Database Migration
```bash
gcloud app deploy backend/migrate.yaml
```

### ✅ 2. Create Superuser
```bash
# Connect via Cloud Shell and run:
# python manage.py createsuperuser
```

### ✅ 3. Test Application
- [ ] Visit https://your-project-id.appspot.com
- [ ] Test user registration/login
- [ ] Test diagram creation
- [ ] Test real-time collaboration features

## Important URLs After Deployment

- **Application**: https://your-project-id.appspot.com
- **Admin Panel**: https://your-project-id.appspot.com/admin/
- **API Documentation**: https://your-project-id.appspot.com/api/

## Support

If you encounter issues:
1. Check the logs: `gcloud app logs tail -s default`
2. Review the deployment guide: `DEPLOYMENT_GUIDE.md`
3. Check Google Cloud Console for service status