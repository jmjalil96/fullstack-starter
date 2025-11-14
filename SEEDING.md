# 🌱 Database Seeding Guide

This guide explains how to populate your database with initial/test data.

---

## 📋 What Gets Seeded

Your seed file (`api/prisma/seed.ts`) creates:

1. **Roles** (7 roles)
   - SUPER_ADMIN
   - CLAIMS_EMPLOYEE
   - OPERATIONS_EMPLOYEE
   - ADMIN_EMPLOYEE
   - AGENT
   - CLIENT_ADMIN
   - AFFILIATE_USER

2. **Users** (3 test users)
   - Admin user
   - Employee user
   - Client admin user

3. **Clients** (2 companies)
   - TechCorp Inc.
   - MediCare Solutions

4. **Insurers** (2 insurance companies)
   - Nationwide Insurance
   - BlueCross Health

5. **Policies** (multiple insurance policies)
   - Linked to clients and insurers
   - Various statuses and coverage types

6. **Affiliates** (employees/dependents)
   - Owners and dependents
   - Linked to clients

7. **Claims** (sample claims)
   - Various statuses and amounts
   - Linked to policies and affiliates

**Total:** Creates a fully functional demo environment

---

## 🏠 Local Development

### Run Seed Locally

```bash
cd api

# Method 1: Using package.json script
npm run db:seed

# Method 2: Using Prisma directly
npx prisma db seed

# Method 3: Using tsx directly
npx tsx prisma/seed.ts
```

### Reset Database and Reseed

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# This automatically runs seed after reset
# Or manually: npm run db:seed
```

---

## ☁️ DigitalOcean App Platform

### Option 1: Via App Platform Console (Easiest)

1. **Open Console:**
   - Go to App Platform → Your App
   - Click on **"api"** service
   - Click **"Console"** tab (at top)

2. **Run Commands:**
   ```bash
   # Navigate to app directory
   cd /workspace

   # Run seed
   npx tsx prisma/seed.ts
   ```

3. **Monitor Output:**
   - Watch for "🌱 Starting seed..."
   - Verify "✅ Seed completed" message
   - Check data counts

### Option 2: Via Database Console (Manual SQL)

1. **Go to Database Component:**
   - App Platform → Components → **db**
   - Click **"Console"** tab

2. **Create Data Manually:**
   ```sql
   -- Example: Create a role
   INSERT INTO "Role" (id, name, description, "isActive", "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'SUPER_ADMIN',
     'System administrator',
     true,
     NOW(),
     NOW()
   );

   -- Example: Create a client
   INSERT INTO "Client" (id, name, "taxId", email, phone, "isActive", "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'TechCorp Inc.',
     '20123456789',
     'contact@techcorp.com',
     '+1-555-0100',
     true,
     NOW(),
     NOW()
   );
   ```

### Option 3: Via Local Connection (Advanced)

1. **Get Database Credentials:**
   - App Platform → Components → **db**
   - Click **"Connection Details"**
   - Copy connection string

2. **Connect Locally:**
   ```bash
   # Set DATABASE_URL to production database
   export DATABASE_URL="postgresql://user:pass@host:25060/db?sslmode=require"

   # Run seed against production
   npx tsx api/prisma/seed.ts
   ```

   ⚠️ **Warning:** This runs against production database!

### Option 4: Add Seed to Deploy (Not Recommended)

You could add seed to the run_command in `app.yaml`, but this is **dangerous** because:
- ❌ Clears data on every deploy
- ❌ Not idempotent (creates duplicates if run multiple times)
- ❌ Slow deployments

**Don't do this in production!**

---

## 🎯 Recommended Production Strategy

### Initial Setup

**For first deployment:**

1. **Deploy app first** (without seed data)
2. **Run migrations** (automatic)
3. **Create admin user** via app UI or SQL
4. **Manually create essential data:**
   - Initial roles (via SQL or admin panel)
   - First client (via UI)
   - Initial insurers (via UI)

### Ongoing Data Management

**For test/staging environments:**
- Run seed script via console (Option 1)
- Refresh periodically as needed

**For production:**
- **NEVER run seed script** (it deletes all data!)
- Create data via UI/API
- Use migrations for schema changes only
- Manual SQL for bulk imports (if needed)

---

## 🔐 Creating Initial Admin User

### Method 1: Via App Console (Recommended)

```bash
# In App Platform Console (api service):
cd /workspace

# Create admin user
npx tsx -e "
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function createAdmin() {
  const role = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      description: 'System administrator',
      isActive: true
    }
  })

  const user = await prisma.user.create({
    data: {
      email: 'admin@capstone360.com',
      emailVerified: true,
      name: 'Admin User',
      globalRoleId: role.id
    }
  })

  console.log('Admin created:', user.id)
  return user
}

createAdmin().then(() => process.exit(0))
"
```

### Method 2: Via Database Console

```sql
-- 1. Create role
INSERT INTO "Role" (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES ('role123', 'SUPER_ADMIN', 'System administrator', true, NOW(), NOW());

-- 2. Create user
INSERT INTO "User" (id, email, "emailVerified", name, "globalRoleId", "createdAt", "updatedAt")
VALUES (
  'user123',
  'admin@capstone360.com',
  true,
  'Admin User',
  'role123',
  NOW(),
  NOW()
);

-- 3. Copy the user ID and update TEST_USER_ID env var
SELECT id FROM "User" WHERE email = 'admin@capstone360.com';
```

### Method 3: Via UI (After Deploy)

1. Visit your app URL
2. Register a new account
3. Manually verify in database:
   ```sql
   UPDATE "User" SET "emailVerified" = true WHERE email = 'your@email.com';
   UPDATE "User" SET "globalRoleId" = (SELECT id FROM "Role" WHERE name = 'SUPER_ADMIN') WHERE email = 'your@email.com';
   ```

---

## 🔄 CORS for Custom Domains

### When Using DigitalOcean Subdomain

**CORS is automatic!** Both frontend and backend are on same domain:
```
Frontend: https://capstone-360-xxxxx.ondigitalocean.app/
API:      https://capstone-360-xxxxx.ondigitalocean.app/api/
```

No CORS issues because:
- ✅ Same origin (same domain, same port, same protocol)
- ✅ No cross-origin requests

### When Using Custom Domain

**Update CORS in app.yaml:**

```yaml
# If frontend is on different domain:
- key: CORS_ALLOWED_ORIGINS
  value: "https://yourdomain.com,https://www.yourdomain.com"
  scope: RUN_TIME

# If both on same domain (recommended):
- key: CORS_ALLOWED_ORIGINS
  value: ${APP_URL}  # Keep as-is
  scope: RUN_TIME
```

### When Using Separate Domains

If you want to host frontend separately (like Vercel/Netlify):

```yaml
# In app.yaml
- key: CORS_ALLOWED_ORIGINS
  value: "https://yourdomain.com,https://www.yourdomain.com,https://staging.yourdomain.com"
  scope: RUN_TIME
```

---

## 🛠️ Seed Script Customization

### Modify Seed Data

Edit `/api/prisma/seed.ts`:

```typescript
// Add your company data
const myCompany = await prisma.client.create({
  data: {
    name: 'Your Company Name',
    taxId: 'YOUR-TAX-ID',
    email: 'contact@yourcompany.com',
    phone: '+1-555-0123',
    isActive: true,
  }
})

// Add your insurers
const myInsurer = await prisma.insurer.create({
  data: {
    name: 'Your Preferred Insurer',
    code: 'INS001',
    email: 'claims@insurer.com',
    isActive: true,
  }
})
```

### Run Modified Seed

```bash
# Locally
npm run db:seed

# On DigitalOcean (via console)
npx tsx prisma/seed.ts
```

---

## ⚠️ Important Notes

### DO NOT Run Seed in Production

The seed script **DELETES ALL DATA** first:
```typescript
await prisma.policyAffiliate.deleteMany()
await prisma.claim.deleteMany()
// ... deletes everything
```

**Use seed for:**
- ✅ Local development
- ✅ Testing environments
- ✅ Demo/staging environments

**DON'T use seed for:**
- ❌ Production (after initial setup)
- ❌ Databases with real customer data

### Idempotent Seeds

If you want a seed that can run multiple times safely:

```typescript
// Create or update pattern
const role = await prisma.role.upsert({
  where: { name: 'SUPER_ADMIN' },
  update: {},
  create: {
    name: 'SUPER_ADMIN',
    description: 'System administrator',
    isActive: true,
  }
})
```

This won't delete existing data.

---

## 📚 Quick Reference

### Environment Variables Needed

```bash
# Before deployment, generate these:

# 1. Auth secret (32+ characters)
openssl rand -base64 32

# 2. Claim number salt (random string)
openssl rand -base64 24

# 3. After first deploy, get user ID:
# - Create user via UI or SQL
# - Copy user ID from database
# - Update TEST_USER_ID env var
```

### Deployment Flow

```mermaid
1. Deploy app (migrations run automatically)
   ↓
2. Create admin user (via console/SQL)
   ↓
3. Update TEST_USER_ID env var
   ↓
4. (Optional) Seed initial data
   ↓
5. Start using the app!
```

---

## 🆘 Troubleshooting

### Seed Fails: "Required env variable missing"

The seed might use `env.TEST_USER_ID`. Either:
- Set TEST_USER_ID before running seed
- Comment out that validation in seed.ts temporarily

### Can't Connect to Database

Check connection string has `?sslmode=require`:
```bash
postgresql://user:pass@host:25060/db?sslmode=require
```

### Seed Takes Too Long

Large seed files (1000s of records) can timeout. Solutions:
- Split into smaller batches
- Use database console with SQL COPY command
- Create data incrementally via API

---

## ✅ Quick Start Checklist

- [ ] Deploy app to DigitalOcean
- [ ] Note the app URL (e.g., `https://capstone-360-xxxxx.ondigitalocean.app`)
- [ ] CORS automatically works (same domain)
- [ ] Create first admin user (via console or SQL)
- [ ] Update TEST_USER_ID environment variable
- [ ] (Optional) Run seed script for demo data
- [ ] Start using the app!

**You're all set!** No custom domain needed - the free DigitalOcean subdomain works perfectly.
