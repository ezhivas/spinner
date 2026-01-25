# 🔀 Dual-Mode Development Guide - Stage 7

## Overview

SpinneR supports two development modes:
- **Docker Mode**: Full stack with PostgreSQL + Redis (production-like)
- **Electron Mode**: Standalone with SQLite (desktop app testing)

Both modes use the same codebase with automatic mode detection.

## Quick Start

### Docker Mode (Web Development)

```bash
npm run dev:docker
```

**Opens**: http://localhost:3000 in your browser  
**Best for**: Frontend development, API testing, team collaboration

### Electron Mode (Desktop Development)

```bash
npm run dev:electron
```

**Opens**: Desktop application window  
**Best for**: Desktop features, offline mode, native integration

## Detailed Comparison

| Feature | Docker Mode | Electron Mode |
|---------|------------|---------------|
| **Command** | `npm run dev:docker` | `npm run dev:electron` |
| **Database** | PostgreSQL | SQLite |
| **Queue** | Redis + BullMQ | Synchronous (no queue) |
| **UI** | Browser | Desktop window |
| **Hot Reload** | ✅ Backend only | ❌ Requires restart |
| **DevTools** | Browser DevTools | Electron DevTools |
| **File Dialogs** | Browser download | Native macOS dialogs |
| **Offline** | ❌ Needs DB + Redis | ✅ Fully offline |
| **Multi-user** | ✅ Possible | ❌ Single user |
| **Setup Time** | ~30 sec (Docker startup) | ~10 sec |

## When to Use Each Mode

### Use Docker Mode When:
- ✅ Developing frontend/UI
- ✅ Testing API endpoints
- ✅ Working with team (shared DB)
- ✅ Need PostgreSQL-specific features
- ✅ Testing async queue behavior
- ✅ Want hot-reload for rapid iteration

### Use Electron Mode When:
- ✅ Testing desktop app packaging
- ✅ Testing native macOS features
- ✅ Testing SQLite compatibility
- ✅ Testing offline functionality
- ✅ Testing standalone installer
- ✅ Verifying no external dependencies

## Setup Instructions

### First-Time Setup

#### 1. Docker Mode Setup

```bash
# Ensure Docker is installed and running
docker --version

# No additional setup needed
# docker-compose.yml is already configured
```

#### 2. Electron Mode Setup

```bash
# Rebuild native modules
npm run electron:rebuild

# No additional setup needed
# .env.electron is already configured
```

### Environment Files

#### `.env.docker` (Already created)
```bash
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=api_client
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_ENABLED=true
```

#### `.env.electron` (Already created)
```bash
DB_TYPE=sqlite
DB_PATH=./data/spinner-dev.db
REDIS_ENABLED=false
LOG_DB_QUERIES=true
PORT=3000
```

## Development Workflows

### Workflow 1: Frontend Development (Docker Mode)

```bash
# Terminal 1: Start Docker services
npm run dev:docker

# Browser: Open http://localhost:3000
# Edit files in public/
# Changes reflect immediately in browser
```

**Advantages**:
- Hot-reload (just refresh browser)
- Familiar browser DevTools
- Full database (PostgreSQL)

### Workflow 2: Desktop App Development (Electron Mode)

```bash
# Terminal 1: Start Electron
npm run dev:electron

# Edit electron/main.js or electron/preload.js
# Restart app to see changes
```

**Advantages**:
- Test native features
- Test standalone deployment
- Offline testing

### Workflow 3: Backend Development (Any Mode)

```bash
# Option A: Docker Mode
npm run dev:docker

# Option B: Electron Mode  
npm run dev:electron

# Edit files in src/
# Both modes auto-reload backend (nest start --watch)
```

**Tip**: Use Docker mode for backend development - hot-reload works better.

### Workflow 4: Hybrid Mode (Advanced)

```bash
# Terminal 1: Start only Docker services (DB + Redis)
docker-compose up postgres redis

# Terminal 2: Start backend locally
npm run start:dev

# Terminal 3: Start Electron UI
electron electron/main.js
```

**Advantages**:
- Real database (PostgreSQL) for data testing
- Electron UI for desktop testing
- Backend hot-reload

## Switching Between Modes

The scripts handle environment switching automatically:

```bash
# Switch to Docker mode
npm run dev:docker
# → Copies .env.docker to .env
# → Starts docker-compose

# Switch to Electron mode  
npm run dev:electron
# → Copies .env.electron to .env
# → Starts standalone app
```

**Manual switching**:
```bash
# Check current mode
cat .env | head -1

# Manually switch to Docker
cp .env.docker .env

# Manually switch to Electron
cp .env.electron .env
```

## Troubleshooting

### Docker Mode Issues

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev:docker
```

**Docker containers won't start:**
```bash
docker-compose down
docker-compose up --build
```

**Database connection error:**
```bash
# Check containers are running
docker-compose ps

# View logs
docker-compose logs postgres
```

### Electron Mode Issues

**Backend won't start:**
```bash
# Check if backend compiled
npm run build

# Try running backend manually
npm run start:prod
```

**SQLite database errors:**
```bash
# Remove old database
rm -f data/spinner-dev.db

# Restart Electron
npm run dev:electron
```

**Native module error:**
```bash
npm run electron:rebuild
npm run dev:electron
```

## Data Management

### Database Locations

**Docker Mode:**
```bash
# PostgreSQL data
docker volume ls | grep postgres

# View data
docker-compose exec postgres psql -U postgres -d api_client
```

**Electron Mode:**
```bash
# SQLite database
./data/spinner-dev.db

# View data
sqlite3 data/spinner-dev.db "SELECT * FROM requests;"
```

### Migrating Data Between Modes

Currently, there's no automatic migration. Each mode maintains its own database.

**Manual migration**:
```bash
# 1. Export from Docker mode
npm run dev:docker
# Use UI: Backup → Export

# 2. Switch to Electron mode
npm run dev:electron
# Use UI: Backup → Import
```

## Best Practices

### 1. Development Phase

Use **Docker Mode** for:
- Initial development
- Team collaboration
- API testing

### 2. Testing Phase

Use **Electron Mode** for:
- Desktop app testing
- Offline testing
- Packaging validation

### 3. Daily Workflow

```bash
# Morning: Start with Docker mode
npm run dev:docker

# Develop features in browser

# Before commit: Test in Electron
npm run dev:electron

# Verify nothing broke in desktop mode
```

### 4. Pre-Release

```bash
# 1. Test both modes
npm run dev:docker   # ✓
npm run dev:electron # ✓

# 2. Test packaging
npm run pack # ✓

# 3. Test installer
npm run build:mac # ✓
```

## Scripts Reference

### Development Scripts

```bash
npm run dev              # Alias for dev:docker
npm run dev:docker       # Start Docker mode
npm run dev:electron     # Start Electron mode
```

### Build Scripts

```bash
npm run build            # Build backend only
npm run build:backend    # Build backend only
npm run pack             # Package app (no installer)
npm run build:mac        # Build DMG installer
```

### Utility Scripts

```bash
npm run start            # Start backend (production)
npm run start:dev        # Start backend (development)
npm run start:prod       # Start backend (production)
npm run electron:rebuild # Rebuild native modules
```

## Environment Variables Summary

| Variable | Docker | Electron | Purpose |
|----------|--------|----------|---------|
| `DB_TYPE` | postgres | sqlite | Database selection |
| `DB_HOST` | postgres | - | PostgreSQL host |
| `DB_PATH` | - | ./data/*.db | SQLite path |
| `REDIS_ENABLED` | true | false | Queue toggle |
| `REDIS_HOST` | redis | - | Redis host |
| `LOG_DB_QUERIES` | false | true | Query logging |

## Tips & Tricks

### Tip 1: Keep Both Environments in Sync

```bash
# After pulling changes
npm install              # Update dependencies
npm run build           # Rebuild backend
npm run electron:rebuild # Rebuild native modules
```

### Tip 2: Quick Mode Check

```bash
# Check which mode is active
cat .env | grep DB_TYPE
```

### Tip 3: Clean Start

```bash
# Docker mode
docker-compose down -v
npm run dev:docker

# Electron mode
rm -rf data/
npm run dev:electron
```

### Tip 4: Parallel Testing

```bash
# Terminal 1: Docker mode on port 3000
npm run dev:docker

# Terminal 2: Electron mode on port 3001
PORT=3001 npm run dev:electron
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port conflict | `lsof -ti:3000 \| xargs kill -9` |
| Docker won't start | `docker-compose down && docker-compose up` |
| Electron crashes | `npm run electron:rebuild` |
| Database not found | Check `.env` has correct `DB_TYPE` |
| Hot-reload not working | Restart development server |

---

**Status**: Stage 7 complete!  
**Both modes**: Fully functional and documented.  
**Next**: Stage 8 (Distribution setup - optional)
