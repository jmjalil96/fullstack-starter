# 🚀 Deployment Guide - DigitalOcean App Platform

This guide walks you through deploying Capstone 360 to DigitalOcean App Platform.

## 📋 Prerequisites

- [ ] DigitalOcean account ([Sign up](https://cloud.digitalocean.com/registrations/new))
- [ ] GitHub repository pushed with latest code
- [ ] Domain name (optional, App Platform provides free subdomain)

---

## 🎯 Quick Deploy (10 minutes)

### Step 1: Prepare Environment Variables

Generate your production secrets:

```bash
# Generate BetterAuth secret (32+ characters)
openssl rand -base64 32
# Example output: dXNlX3RoaXNfc2VjcmV0X2tleV9mb3JfcHJvZHVjdGlvbg==

# Copy for later - you'll paste this in DigitalOcean UI
```

### Step 2: Deploy via UI

1. **Go to App Platform:**
   - Visit: https://cloud.digitalocean.com/apps
   - Click **"Create App"**

2. **Connect GitHub:**
   - Choose **"GitHub"**
   - Authorize DigitalOcean
   - Select repository: `jmjalil96/fullstack-starter`
   - Select branch: `main`
   - **Auto-deploy:** Enable (deploys on every push)

3. **App Platform Auto-Detects `app.yaml`:**
   - It will read your `app.yaml` configuration
   - Review detected services:
     - ✅ API (Node.js service)
     - ✅ Web (Static site)
     - ✅ db (PostgreSQL 16)

4. **Configure Environment Variables:**

   Click on **API service** → **Environment Variables** → Edit:

   ```bash
   # Update these required variables:

   BETTER_AUTH_SECRET=<paste-generated-secret-from-step-1>

   # Get TEST_USER_ID after first deploy:
   # 1. Deploy app first
   # 2. Create a user via the UI
   # 3. Connect to database and get user ID
   # 4. Update this variable
   TEST_USER_ID=will-update-after-first-user-created

   # These are auto-generated (leave as-is):
   DATABASE_URL=${db.DATABASE_URL}
   BETTER_AUTH_URL=${APP_URL}
   NODE_ENV=production
   ```

5. **Review Resources:**
   - API: basic-xxs ($5/month) - Good for development
   - Web: Static site ($3/month)
   - Database: Dev tier ($7/month)
   - **Total: ~$15/month**

6. **Click "Create Resources"**
   - Build takes 3-5 minutes
   - Migrations run automatically
   - App deploys to: `https://capstone-360-xxxxx.ondigitalocean.app`

---

## 🔧 Post-Deployment Setup

### Step 1: Create First User

After deployment completes, you need to create a user and get the ID:

**Option A: Via Database Console**
```bash
# 1. Go to App Platform → Components → db → Console
# 2. Run this SQL:
INSERT INTO "User" (id, email, "emailVerified", name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin@capstone360.com', true, 'Admin', NOW(), NOW())
RETURNING id;

# 3. Copy the returned user ID
```

**Option B: Via App UI**
1. Visit your app URL
2. Register a new account
3. Verify email (if email service configured)
4. Get user ID from database

### Step 2: Update TEST_USER_ID

1. Go to **App Platform** → Your App → **API Service** → **Settings**
2. Scroll to **Environment Variables**
3. Edit `TEST_USER_ID` and paste the user ID from Step 1
4. Click **Save** (triggers automatic redeployment)

### Step 3: Verify Deployment

Test your endpoints:

```bash
# Check API health
curl https://your-app.ondigitalocean.app/api/health

# Expected: {"status":"ok"}

# Test authentication
curl https://your-app.ondigitalocean.app/api/auth/get-session

# Test frontend
open https://your-app.ondigitalocean.app
```

---

## 🌐 Custom Domain (Optional)

### Step 1: Add Domain in App Platform

1. **App Settings** → **Domains** → **Add Domain**
2. Enter your domain: `capstone360.com`
3. DigitalOcean provides DNS instructions

### Step 2: Update DNS Records

Add these records to your domain registrar:

```
Type    Name    Value
A       @       <app-platform-ip>
CNAME   www     <app-url>.ondigitalocean.app
```

### Step 3: Update BETTER_AUTH_URL

1. Edit API environment variable
2. Change from `${APP_URL}` to `https://capstone360.com`
3. Save (triggers redeploy)

### Step 4: Enable HTTPS

App Platform automatically provisions SSL certificates (Let's Encrypt).
Wait 5-10 minutes after DNS propagation.

---

## 📊 Monitoring & Logs

### View Logs

**Runtime Logs:**
- App Platform → Your App → **Runtime Logs** tab
- Filter by service (API or Web)
- Real-time streaming

**Build Logs:**
- Shown during deployment
- View past deployments: **Deployments** tab

### Metrics

**Insights Tab:**
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

### Set Up Alerts

**Settings → Alerts:**
```
- CPU > 80% for 5 minutes
- Memory > 80% for 5 minutes
- HTTP 5xx errors > 10 in 5 minutes
- Container crashes
```

---

## 🔄 CI/CD Workflow

### Automatic Deployments

With `deploy_on_push: true`, every git push triggers deployment:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# DigitalOcean automatically:
# 1. Detects push
# 2. Runs build commands
# 3. Runs migrations
# 4. Deploys new version
# 5. Health checks pass
# 6. Switches traffic (zero downtime)
```

### Manual Deployments

Via CLI:
```bash
# Install doctl
brew install doctl  # macOS
# Or: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# List apps
doctl apps list

# Trigger deployment
doctl apps create-deployment <app-id>
```

---

## 📈 Scaling

### Vertical Scaling (More Power)

Edit `app.yaml`:
```yaml
instance_size_slug: basic-xs  # $12/month (1GB RAM, 1 vCPU)
# Options: basic-xxs, basic-xs, basic-s, basic-m, professional-xs, etc.
```

### Horizontal Scaling (More Instances)

Edit `app.yaml`:
```yaml
instance_count: 2  # Run 2 API containers (load balanced)
```

### Database Scaling

Edit `app.yaml`:
```yaml
databases:
  - name: db
    production: true  # Enables backups, failover, more resources
```

Push changes to deploy.

---

## 🔐 Security Checklist

- [ ] Use strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Enable database production mode (backups)
- [ ] Set up database connection pooling (Prisma handles this)
- [ ] Configure CORS properly (whitelist your domains)
- [ ] Enable App Platform firewall rules (optional)
- [ ] Review API rate limits
- [ ] Set up monitoring alerts
- [ ] Regular security updates (automatic with App Platform)

---

## 🛠️ Troubleshooting

### Build Fails

**Check build logs:**
- App Platform → Deployments → Click failed deployment → Build Logs

**Common issues:**
```bash
# Missing dependencies
→ Fix: Ensure package.json has all dependencies

# TypeScript errors
→ Fix: Run `npm run build` locally first

# Prisma schema issues
→ Fix: Ensure migrations are committed
```

### Runtime Errors

**Check runtime logs:**
- App Platform → Runtime Logs → Filter by API

**Common issues:**
```bash
# Database connection fails
→ Check: DATABASE_URL is ${db.DATABASE_URL}

# Authentication fails
→ Check: BETTER_AUTH_SECRET is set
→ Check: BETTER_AUTH_URL matches your domain

# Migrations fail
→ Check: Migrations are committed to git
→ Check: Database is accessible
```

### Frontend Not Loading

**Check:**
```bash
# Build output directory
→ Ensure: output_dir: dist in app.yaml

# SPA routing (404 on refresh)
→ Ensure: catchall_document: index.html

# API calls fail (CORS)
→ Check: CORS_ALLOWED_ORIGINS includes your domain
```

---

## 🔄 Rollback

### Via UI
1. **Deployments** tab
2. Find working deployment
3. Click **"⋮"** → **"Rollback"**

### Via CLI
```bash
doctl apps list-deployments <app-id>
doctl apps create-deployment <app-id> --deployment-id <previous-deployment-id>
```

---

## 💾 Database Backups

### Enable Automatic Backups

Set in `app.yaml`:
```yaml
databases:
  - name: db
    production: true  # Enables daily backups
```

### Manual Backup

```bash
# Get connection string from App Platform UI
# Then use pg_dump:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Restore Backup

```bash
psql $DATABASE_URL < backup-20251113.sql
```

---

## 📚 Additional Resources

- **App Platform Docs:** https://docs.digitalocean.com/products/app-platform/
- **App Spec Reference:** https://docs.digitalocean.com/products/app-platform/reference/app-spec/
- **doctl CLI:** https://docs.digitalocean.com/reference/doctl/
- **Pricing Calculator:** https://www.digitalocean.com/pricing/app-platform

---

## 🆘 Support

**Issues during deployment?**

1. Check **Runtime Logs** in App Platform
2. Review **Build Logs** for errors
3. Test locally: `npm run build` in both `api/` and `client/`
4. Compare with `app.yaml` configuration
5. DigitalOcean Community: https://www.digitalocean.com/community

---

## ✅ Deployment Checklist

Before going to production:

- [ ] All tests passing (`npm test`)
- [ ] Builds successful locally (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations committed
- [ ] BETTER_AUTH_SECRET is strong (32+ chars)
- [ ] TEST_USER_ID updated with real user
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active (automatic)
- [ ] Database backups enabled (`production: true`)
- [ ] Monitoring alerts configured
- [ ] Error tracking set up
- [ ] Performance tested with realistic data
- [ ] Security review completed

---

**Ready to deploy!** 🎉

Just push your code to GitHub and follow Step 2 above to create your app in DigitalOcean.
