# Database Setup Instructions for Google Cloud SQL

## 1. Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create uml-diagrams-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=your-root-password

# Create database
gcloud sql databases create umldiagrams --instance=uml-diagrams-db

# Create user
gcloud sql users create umluser \
    --instance=uml-diagrams-db \
    --password=your-user-password
```

## 2. Configure Environment Variables

Update your `app.yaml` with the correct values:

```yaml
env_variables:
  DB_NAME: "umldiagrams"
  DB_USER: "umluser"
  DB_PASSWORD: "your-user-password"
  DB_HOST: "/cloudsql/your-project-id:us-central1:uml-diagrams-db"
  DB_PORT: "5432"
```

## 3. Run Migrations

After deployment, run migrations:

```bash
gcloud app deploy migrate.yaml
```

## 4. Create Superuser

Create a superuser for Django admin:

```bash
# Connect to your deployed app
gcloud app browse

# Or use Cloud Shell to run management commands
gcloud app deploy --version=create-superuser --no-promote
```

## 5. Backup Strategy

Set up automated backups:

```bash
gcloud sql backups create --instance=uml-diagrams-db
```