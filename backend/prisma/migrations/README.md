# Migrations – fresh baseline

All old migration files were removed and replaced with a **single baseline migration** that creates the full schema from `schema.prisma` in one step.

## Migration in use

- **`20260216120000_init`** – Creates all enums, tables, indexes, and foreign keys for the current schema (HRMS, Halal, Membership, etc.).

## Apply the baseline (development)

Your database still has the previous migration history and tables. To start clean with only this migration:

1. **Reset the database** (drops all data and reapplies migrations):
   ```bash
   cd backend
   npx prisma migrate reset
   ```
   When prompted, confirm. This will:
   - Drop the `public` schema (or the database)
   - Recreate it
   - Apply `20260216120000_init`
   - Run `prisma generate`
   - Run seed if configured

2. **Re-seed** if you use a seed script:
   ```bash
   npx prisma db seed
   ```

**Warning:** `prisma migrate reset` **permanently deletes all data** in the database. Use it only on a **development** database, not production.

## Production

Do **not** run `migrate reset` in production. For an existing production database that already has the schema, you can baseline the migration history instead:

```bash
npx prisma migrate resolve --applied "20260216120000_init"
```

That marks the init migration as applied without running it, so future `migrate deploy` only runs newer migrations.

## New changes after this

For future schema changes:

```bash
npx prisma migrate dev --name describe_your_change
```

This will create a new migration folder and apply it, without touching the init migration.
