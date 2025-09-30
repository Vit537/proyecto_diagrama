# Google Cloud Storage Setup Instructions

## 1. Create Storage Bucket

```bash
# Create bucket for static and media files
gsutil mb -p your-project-id -c STANDARD -l us-central1 gs://your-bucket-name

# Make bucket publicly readable for static files
gsutil iam ch allUsers:objectViewer gs://your-bucket-name

# Set up CORS for the bucket (if needed for frontend uploads)
echo '[
  {
    "origin": ["https://your-domain.com", "https://your-app-engine-url.appspot.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

gsutil cors set cors.json gs://your-bucket-name
```

## 2. Service Account Setup

```bash
# Create service account
gcloud iam service-accounts create storage-service-account \
    --display-name="Storage Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:storage-service-account@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Create key file
gcloud iam service-accounts keys create storage-key.json \
    --iam-account=storage-service-account@your-project-id.iam.gserviceaccount.com
```

## 3. Environment Variables

Update your `app.yaml`:

```yaml
env_variables:
  GS_BUCKET_NAME: "your-bucket-name"
  GS_PROJECT_ID: "your-project-id"
  USE_GCS: "True"
  GOOGLE_APPLICATION_CREDENTIALS: "storage-key.json"
```

## 4. Directory Structure in Bucket

Your bucket will have the following structure:
```
your-bucket-name/
├── static/          # Django static files
├── media/           # User uploaded files
│   ├── generated_code/
│   └── user_avatars/
└── frontend/        # React build files (if serving from GCS)
```