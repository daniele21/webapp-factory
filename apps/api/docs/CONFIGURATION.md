# Configuration Management Guide

This guide explains all the ways you can edit and manage configurations in the Webapp Factory API.

## 🎯 Quick Start

The easiest way to get started is using environment files:

```bash
# Generate a template for your environment
python scripts/config_manager.py generate development

# Copy the generated file
cp .env.development .env

# Edit the .env file with your settings
```

## 📝 Configuration Methods

### 1. Environment Variables (.env files) - **RECOMMENDED**

**Pros:** Secure, standard practice, works with Docker/Kubernetes
**Use for:** Production, CI/CD, sensitive data

```bash
# Generate environment files
python scripts/config_manager.py generate development
python scripts/config_manager.py generate production

# Edit .env file
APP_JWT_SECRET_KEY=your-secret-key
APP_GOOGLE_CLIENT_ID=your-google-client-id
APP_REDIS_URL=redis://localhost:6379
```

### 2. JSON Configuration Files

**Pros:** Structured, easy to read, supports complex nested data
**Use for:** Development, complex configurations, team sharing

```bash
# Use the provided JSON template
cp config.development.json config.json

# Edit config.json
{
  "auth": {
    "jwt": {
      "secret_key": "your-secret-key",
      "access_token_expire_minutes": 60
    }
  }
}
```

### 3. Direct Python Configuration

**Pros:** Full programmatic control, validation, dynamic values
**Use for:** Advanced customization, environment-specific logic

Edit files in `config/environments/`:
- `development.py` - Development settings
- `testing.py` - Test settings  
- `production.py` - Production settings

## 🔧 Configuration Structure

### Authentication (`config/auth.py`)
```python
# JWT Settings
APP_JWT_SECRET_KEY=your-256-bit-secret
APP_JWT_ALGORITHM=HS256
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# OAuth
APP_GOOGLE_CLIENT_ID=your-client-id
APP_GOOGLE_CLIENT_SECRET=your-client-secret
APP_OAUTH_REDIRECT_URI=http://127.0.0.1:5173/auth/callback

# Security
APP_MIN_PASSWORD_LENGTH=8
APP_MAX_LOGIN_ATTEMPTS=5
APP_MFA_ENABLED=true
```

### Database (`config/database.py`)
```python
# Firestore
APP_GOOGLE_PROJECT_ID=your-project-id
APP_FIRESTORE_EMULATOR_HOST=localhost:8080
APP_USE_FIRESTORE_EMULATOR=true

# Redis
APP_REDIS_URL=redis://localhost:6379
APP_REDIS_DATABASE=0
APP_REDIS_PASSWORD=your-password
```

### Feature Flags (`config/features.py`)
```python
# Storage
APP_FEATURE_FLAGS_STORAGE=memory  # or redis/firestore
APP_FEATURE_FLAGS_CACHE_TTL=300

# API
APP_ADMIN_API_ENABLED=true
APP_METRICS_ENABLED=true
```

### Logging (`config/logging.py`)
```python
# Basic settings
APP_LOG_LEVEL=INFO
APP_LOG_FORMAT=json
APP_LOG_REQUESTS=true

# Monitoring
APP_METRICS_ENABLED=true
APP_TRACING_ENABLED=true
APP_SENTRY_DSN=your-sentry-dsn
```

## 🛠️ Configuration Tools

### Config Manager CLI

```bash
# Generate environment files
python scripts/config_manager.py generate development
python scripts/config_manager.py generate production --output .env.prod

# Validate configuration
python scripts/config_manager.py validate
python scripts/config_manager.py validate production

# Show current configuration
python scripts/config_manager.py show
python scripts/config_manager.py show development

# Compare configurations
python scripts/config_manager.py compare
```

### Programmatic Access

```python
from settings import settings

# Access component configurations
auth_config = settings.auth
db_config = settings.database
features_config = settings.features

# Check environment
if settings.is_production():
    print("Running in production")

# Validate configuration
issues = settings.validate_configuration()
if issues:
    print("Configuration issues:", issues)
```

## 🌍 Environment-Specific Configuration

### Development
- Debug mode enabled
- Local services (Firestore emulator, Redis)
- Relaxed security settings
- Detailed logging

```bash
APP_ENV=development
APP_DEBUG=true
APP_USE_FIRESTORE_EMULATOR=true
APP_LOG_LEVEL=DEBUG
```

### Testing
- Minimal logging
- In-memory storage where possible
- Isolated test data
- Fast execution

```bash
APP_ENV=testing
APP_DEBUG=false
APP_FEATURE_FLAGS_STORAGE=memory
APP_LOG_LEVEL=WARNING
```

### Production
- Security hardened
- Performance optimized
- Comprehensive monitoring
- Secure defaults

```bash
APP_ENV=production
APP_DEBUG=false
APP_COOKIE_SECURE=true
APP_HSTS_ENABLED=true
APP_RATE_LIMITING_ENABLED=true
```

## 🔒 Security Best Practices

### 1. Environment Files
- Never commit `.env` files to version control
- Use different files for different environments
- Set proper file permissions (600)

```bash
# Create environment-specific files
.env.development  # For local development
.env.testing      # For CI/CD testing
.env.production   # For production (keep secure!)

# Set proper permissions
chmod 600 .env*
```

### 2. Secret Management
- Use strong, unique secrets for each environment
- Rotate secrets regularly
- Use external secret management in production

```bash
# Generate strong secrets
openssl rand -base64 64

# Use environment-specific secrets
DEV_JWT_SECRET=dev-secret-123
PROD_JWT_SECRET=super-secure-production-secret-456
```

### 3. Production Validation
```bash
# Always validate production config
python scripts/config_manager.py validate production

# Check for security issues
python -c "
from settings import settings
issues = settings.validate_configuration()
if issues:
    print('❌ Issues found:', issues)
    exit(1)
else:
    print('✅ Configuration is valid')
"
```

## 📚 Common Configuration Tasks

### Adding a New Feature Flag
```python
# 1. Edit config/features.py or JSON file
"new_feature": {
  "enabled": false,
  "strategy": "percentage",
  "percentage": 10,
  "description": "New experimental feature"
}

# 2. Use in code
from settings import settings
if settings.features.get_flag("new_feature").enabled:
    # Feature logic here
    pass
```

### Updating Database Connection
```bash
# Environment variable
APP_REDIS_URL=redis://new-host:6379

# Or JSON config
{
  "database": {
    "redis": {
      "url": "redis://new-host:6379",
      "database": 0
    }
  }
}
```

### Changing Authentication Settings
```bash
# Increase token expiration
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Enable MFA
APP_MFA_ENABLED=true
APP_MFA_REQUIRED_FOR_ADMIN=true

# Update OAuth settings
APP_GOOGLE_CLIENT_ID=new-client-id
APP_OAUTH_REDIRECT_URI=https://app.yourdomain.com/auth/callback
```

## 🚀 Deployment Configuration

### Docker
```dockerfile
# Copy environment file
COPY .env.production /app/.env

# Or use build args
ARG JWT_SECRET_KEY
ENV APP_JWT_SECRET_KEY=$JWT_SECRET_KEY
```

### Kubernetes
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  APP_ENV: "production"
  APP_REDIS_URL: "redis://redis-service:6379"
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
data:
  APP_JWT_SECRET_KEY: <base64-encoded-secret>
```

### Docker Compose
```yaml
services:
  api:
    environment:
      - APP_ENV=production
      - APP_JWT_SECRET_KEY=${JWT_SECRET_KEY}
    env_file:
      - .env.production
```

## 🔍 Troubleshooting

### Configuration Not Loading
```bash
# Check current configuration
python scripts/config_manager.py show

# Validate configuration
python scripts/config_manager.py validate

# Check environment variables
env | grep APP_
```

### Import Errors
```python
# Make sure to import from settings
from settings import settings

# Not directly from config modules
# from config.auth import AuthConfig  ❌
```

### Environment Detection
```bash
# Set environment explicitly
export APP_ENV=production

# Or in .env file
APP_ENV=production
```

This configuration system gives you maximum flexibility while maintaining security and ease of use!