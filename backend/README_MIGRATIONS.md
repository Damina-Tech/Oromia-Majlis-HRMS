# Prisma Migration Guide

## Shadow Database Issue Fix

If you encounter the shadow database error when running `prisma migrate dev`, use one of these solutions:

### Solution 1: Use `prisma migrate deploy` (Recommended)

For applying migrations that are already created, use:
```bash
npx prisma migrate deploy
```

This command doesn't use shadow database validation and is safe when you know the migrations are correct.

### Solution 2: Create Migration Without Applying

If you need to create a new migration but the shadow database has issues:

```bash
# Create migration file only (doesn't apply)
npx prisma migrate dev --create-only --name your_migration_name

# Then apply it manually
npx prisma db execute --file prisma/migrations/XXXXX_your_migration_name/migration.sql --schema prisma/schema.prisma

# Mark as applied
npx prisma migrate resolve --applied XXXXX_your_migration_name

# Generate client
npx prisma generate
```

### Solution 3: Use Separate Shadow Database

Create a separate database for shadow database validation:

1. Create a new database (e.g., `chiro_hrms_shadow`)
2. Add to `.env`:
   ```
   SHADOW_DATABASE_URL="postgresql://user:password@localhost:5433/chiro_hrms_shadow"
   ```
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
   }
   ```

### Current Status

The `LeavePolicy` migration has been applied successfully. Future migrations can use `prisma migrate deploy` to avoid shadow database issues.

