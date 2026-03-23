# FactoryOS — Export Package

This archive contains the full FactoryOS codebase and database dump.

## What's Included

```
factoryos-export/
├── (all source files)       ← Express.js backend + frontend HTML/JS/CSS
├── migrations/              ← All database migrations
├── public/                  ← Frontend HTML pages and assets
├── routes/                  ← API route handlers
├── db/
│   └── factoryos_dump.sql  ← Full PostgreSQL schema + data
└── README_EXPORT.md         ← You're reading this
```

---

## Push to Your GitHub Repo

### Prerequisites
- Git installed
- Access to your target repo: `https://github.com/kcswimrac/factoryos`

### Steps

```bash
# 1. Extract the archive
tar -xzf factoryos-export.tar.gz
cd factoryos-export

# 2. Initialize git (if not already)
git init
git add .
git commit -m "Initial FactoryOS commit"

# 3. Push to your repo
git remote add origin https://github.com/kcswimrac/factoryos.git
git branch -M main
git push -u origin main
```

If your repo already has content and you want to overwrite it:
```bash
git push -u origin main --force
```

---

## Restore the Database

### Prerequisites
- PostgreSQL installed (`psql` command available)
- A target database already created

### Restore

```bash
# Create a fresh database (skip if you already have one)
createdb factoryos

# Restore the dump
psql factoryos < db/factoryos_dump.sql
```

Or with a full connection string:
```bash
psql "postgresql://user:password@host:5432/factoryos" < db/factoryos_dump.sql
```

### Environment Setup

Copy `.env.example` and fill in your values:
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.
```

---

## Run Locally

```bash
npm install
npm run migrate    # Apply any pending migrations
npm start          # Start on port 3000
```

App will be at: http://localhost:3000
