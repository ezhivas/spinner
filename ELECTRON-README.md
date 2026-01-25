# SpinneR API Client - Electron Desktop App

## ✅ Stages 1-5 Complete!

The following has been implemented:

### Stage 1: Project Preparation ✅
- [x] Installed Electron dependencies (electron, electron-builder, etc.)
- [x] Installed runtime dependencies (get-port, better-sqlite3, sqlite3)
- [x] Created `JsonColumn` decorator for PostgreSQL/SQLite compatibility
- [x] Updated all entities to use `JsonColumn` instead of `@Column({ type: 'jsonb' })`
- [x] Verified no compilation errors
- [x] Rebuilt native modules for Electron

### Stage 2: Electron Setup ✅
- [x] Created `electron/` directory structure
- [x] Created `electron/main.js` (Main Process)
  - Starts NestJS backend as child process
  - Uses dynamic port selection (3000-3010)
  - Manages window lifecycle
  - Creates native macOS menu
- [x] Created `electron/preload.js` (Preload Script)
  - Exposes safe IPC methods to renderer
- [x] Updated `package.json` with Electron scripts
- [x] Created `electron-builder.yml` for packaging
- [x] Created `.env.electron` for configuration

### Stage 3: Database Migration ✅
- [x] Created `src/config/database.config.ts` - multi-database support
- [x] Updated `app.module.ts` - dynamic database configuration  
- [x] Updated `main.ts` - Electron mode detection & static files
- [x] Created `EnumColumn` decorator - SQLite enum compatibility
- [x] Tested SQLite database creation - all tables working

### Stage 4: Backend Adaptation ✅
- [x] Updated `bullmq.module.ts` - in-memory queue for Electron
- [x] Modified `runs.service.ts` - synchronous execution
- [x] Updated `runs.worker.ts` - skip worker in Electron mode
- [x] No Redis dependency in Electron mode

### Stage 5: Frontend Integration ✅
- [x] Added Electron mode detection in `app.js`
- [x] Dynamic API URL based on backend port
- [x] Mode indicator in UI (💻 Desktop / 🌐 Web)
- [x] Native file dialogs for backup/restore

## 🚀 Quick Start

### Development Mode

```bash
# Build the NestJS backend
npm run build

# Run in Electron
npm run electron:dev
```

### Available Scripts

```bash
# Development
npm run electron:dev          # Run app in development mode
npm run electron:rebuild      # Rebuild native modules for Electron

# Production
npm run electron:build        # Build distributable app

# Regular development (Docker)
npm run start:dev             # Start with PostgreSQL/Redis
```

## 📁 Project Structure

```
api-client-backend/
├── electron/
│   ├── main.js              # ✅ Electron main process
│   └── preload.js           # ✅ Preload script for IPC
├── src/
│   ├── common/
│   │   └── decorators/
│   │       └── json-column.decorator.ts  # ✅ Universal JSON column
│   ├── requests/
│   │   └── request.entity.ts             # ✅ Updated
│   ├── environments/
│   │   └── environment.entity.ts         # ✅ Updated
│   └── runs/
│       └── request-run.entity.ts         # ✅ Updated
├── public/                   # Frontend files
├── dist/                     # Built backend (npm run build)
├── .env.electron            # ✅ Electron environment config
├── electron-builder.yml     # ✅ Build configuration
└── package.json             # ✅ Updated with Electron scripts
```

## 🔧 Key Features Implemented

### 1. JSON Column Compatibility
The `JsonColumn` decorator automatically handles differences between PostgreSQL and SQLite:
- **PostgreSQL**: Uses native `jsonb` type
- **SQLite**: Uses `simple-json` type (text with JSON serialization)

### 2. Dynamic Port Selection
Uses `get-port` to find available ports (3000-3010), preventing conflicts.

### 3. Native Module Handling
`better-sqlite3` is automatically rebuilt for Electron via `postinstall` script.

### 4. Process Management
Backend runs as child process and is properly terminated when app closes.

## 🎯 Next Steps (Stage 3-8)

Follow the [ELECTRON-MIGRATION-PLAN.md](./ELECTRON-MIGRATION-PLAN.md) for:

- **Stage 3**: Database migration (PostgreSQL → SQLite)
- **Stage 4**: Backend adaptation (environment detection)
- **Stage 5**: Frontend integration
- **Stage 6**: Building and packaging
- **Stage 7**: Dual-mode support (Docker + Electron)
- **Stage 8**: Distribution

## 🧪 Testing

Before proceeding to Stage 3, test the current implementation:

```bash
# 1. Build backend
npm run build

# 2. Test SQLite compatibility (without Electron)
DB_TYPE=sqlite npm run start:prod

# 3. Test in Electron
npm run electron:dev
```

## ⚠️ Known Issues

1. **App Icons**: Not yet created (need icon.icns for macOS)
2. **Code Signing**: Not configured (needed for distribution)
3. **Redis Queue**: Still requires Redis connection (Stage 4 will add in-memory queue)
4. **Frontend API URL**: Hardcoded to localhost:3000 (Stage 5 will make dynamic)

## 📝 Notes

- All JSON fields now use `JsonColumn` decorator
- All enum fields now use `EnumColumn` decorator  
- Native modules are rebuilt automatically on `npm install`
- Port conflicts are handled automatically
- Database files stored in:
  - Development: `./data/spinner.db`
  - Electron: `~/Library/Application Support/api-client-backend/spinner.db`

## 🐛 Troubleshooting

### "Cannot find module 'better-sqlite3'"
```bash
npm run electron:rebuild
```

### "Port 3000 already in use"
The app automatically finds an available port (3000-3010).

### "Backend fails to start"
Check the Electron console for errors. Ensure `npm run build` completed successfully.

---

**Status**: Stages 1, 2 & 3 complete! Ready for Stage 4 (Backend Adaptation - Redis/Queue).
