# 🎯 SpinneR API Client

> A powerful API testing tool built with NestJS and Electron - works as both a web application and desktop app

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](.) 
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen.svg)](AI_docs/SECURITY.md)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E.svg)](https://nestjs.com/)
[![Electron](https://img.shields.io/badge/Electron-33.0-47848F.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-UNLICENSED-blue.svg)](./)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Development Modes](#-development-modes)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Building](#-building)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

SpinneR is a modern API testing platform similar to Postman or Insomnia, featuring:
- **Dual-mode architecture**: Run as web app (Docker) or desktop app (Electron)
- **Collections & Environments**: Organize requests and manage variables
- **Post-request scripts**: Automate workflows with JavaScript
- **Request history**: Track and replay API calls
- **Backup/Restore**: Export and import your data
- **Queue processing**: Background job execution with BullMQ

## ✨ Features

### 🔥 Core Features
- ✅ **HTTP Request Execution** - Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ **Collections Management** - Organize requests into collections
- ✅ **Environment Variables** - Dynamic variable substitution with `{{ VARIABLE }}` syntax
- ✅ **Post-Request Scripts** - JavaScript execution after responses for automation
- ✅ **Request History** - Track all executed requests with results
- ✅ **Backup & Restore** - Export/import all data as JSON

### 🚀 Advanced Features
- ✅ **Dual Database Support** - PostgreSQL (web) and SQLite (desktop)
- ✅ **Queue System** - BullMQ for async processing (web mode)
- ✅ **Variable Resolution** - Nested variable support with fallback
- ✅ **Security Sandbox** - VM isolation for script execution
- ✅ **Native Integration** - macOS file dialogs and menus (desktop mode)

### 🎨 User Interface
- ✅ Simple, clean HTML/CSS/JavaScript frontend
- ✅ Real-time request/response display
- ✅ Syntax highlighting for JSON
- ✅ Mode indicator (💻 Desktop / 🌐 Web)

## 🛠 Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) 11.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.7
- **Database**: 
  - PostgreSQL (web mode)
  - SQLite with better-sqlite3 (desktop mode)
- **ORM**: [TypeORM](https://typeorm.io/) 0.3
- **Queue**: [BullMQ](https://docs.bullmq.io/) 5.66 + Redis
- **Validation**: class-validator + class-transformer
- **HTTP Client**: Axios 1.13

### Desktop
- **Runtime**: [Electron](https://www.electronjs.org/) 33.0
- **Builder**: electron-builder 26.4
- **Auto-updater**: electron-updater 6.7

### Frontend
- **Stack**: Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS
- **API Communication**: Fetch API

### Development & Testing
- **Testing**: Jest 30.2 + Supertest
- **Linting**: ESLint 9.18 + Prettier
- **Build**: ts-jest, ts-node

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (tested with v24.11.1)
- **npm** 9+
- **Docker & Docker Compose** (for web mode)
- **macOS** (for desktop builds)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd api-client-backend

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run electron:rebuild
```

### Running the Application

#### 🌐 Web Mode (Recommended for development)

```bash
# Start with Docker Compose
npm run dev:docker
# Or
./scripts/dev-docker.sh

# Access at http://localhost:3000
```

This starts:
- NestJS backend on port 3000
- PostgreSQL database
- Redis for queue processing
- Auto-reload on code changes

#### 💻 Desktop Mode

```bash
# Start Electron app
npm run dev:electron
# Or
./scripts/dev-electron.sh
```

This opens a native desktop window with:
- Embedded NestJS backend
- SQLite database
- No external dependencies

## 🔀 Development Modes

SpinneR supports two distinct modes optimized for different use cases:

| Feature | Docker Mode 🌐 | Electron Mode 💻 |
|---------|----------------|------------------|
| **Command** | `npm run dev:docker` | `npm run dev:electron` |
| **Database** | PostgreSQL | SQLite |
| **Queue** | Redis + BullMQ | Synchronous |
| **UI** | Browser | Desktop Window |
| **Hot Reload** | ✅ Backend only | ❌ Requires restart |
| **DevTools** | Browser DevTools | Electron DevTools |
| **Offline** | ❌ Needs services | ✅ Fully offline |
| **Setup Time** | ~30 sec | ~10 sec |

See [DUAL-MODE-GUIDE.md](./DUAL-MODE-GUIDE.md) for detailed comparison.

## 📁 Project Structure

```
api-client-backend/
├── src/                        # Source code
│   ├── backup/                 # Backup/restore functionality
│   ├── collections/            # Collections management
│   ├── common/                 # Shared utilities
│   ├── config/                 # Configuration
│   ├── environments/           # Environment variables
│   ├── http-executor/          # HTTP request execution
│   ├── queue/                  # BullMQ queue setup
│   ├── requests/               # Requests & post-scripts
│   ├── runs/                   # Request execution history
│   ├── app.module.ts           # Main app module
│   └── main.ts                 # Application entry point
├── electron/                   # Electron main process
│   ├── main.js                 # Electron window setup
│   └── preload.js              # Preload script
├── public/                     # Frontend assets
│   ├── index.html              # Main UI
│   ├── app.js                  # Frontend logic
│   └── style.css               # Styles
├── test/                       # E2E tests
├── scripts/                    # Development scripts
├── migrations/                 # Database migrations
├── data/                       # SQLite database files
├── .env.docker                 # Docker mode config
├── .env.electron               # Electron mode config
├── docker-compose.yml          # Docker services
├── electron-builder.yml        # Build configuration
└── package.json                # Dependencies & scripts
```

## 📚 API Documentation

### Collections
- `POST /collections` - Create collection
- `GET /collections` - List all collections
- `GET /collections/:id` - Get collection by ID
- `PATCH /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection

### Requests
- `POST /requests` - Create request
- `GET /requests?collectionId=:id` - List requests
- `GET /requests/:id` - Get request
- `PATCH /requests/:id` - Update request
- `DELETE /requests/:id` - Delete request

### Environments
- `POST /environments` - Create environment
- `GET /environments` - List environments
- `GET /environments/:id` - Get environment
- `PATCH /environments/:id` - Update environment
- `DELETE /environments/:id` - Delete environment

### Runs (Execution)
- `POST /runs` - Execute request
- `GET /runs?requestId=:id` - Get execution history
- `GET /runs/:id` - Get execution details
- `DELETE /runs/cleanup` - Clean old runs

### Backup
- `GET /backup/export` - Export all data
- `POST /backup/import` - Import data

### Swagger Documentation
When running, visit: `http://localhost:3000/api`

## 🧪 Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run all tests + linting
npm run test:all

# Run CI tests (for GitHub Actions)
npm run test:ci
```

### Test Coverage
- **Test Suites**: 10 passed
- **Tests**: 31 passed
- **Files**: Controllers, Services, and Utilities fully tested

## 🏗 Building

### Development Build
```bash
# Build NestJS backend
npm run build
```

### Desktop Application

```bash
# Build for macOS (Universal - both architectures)
npm run build:mac

# Build for macOS (ARM64 only)
npm run build:mac:arm64

# Build for macOS (x64 only)
npm run build:mac:x64

# Build without packaging (for testing)
npm run pack
```

**Output location**: `./release/`

Artifacts:
- `SpinneR-0.0.1.dmg` - Universal installer
- `SpinneR-0.0.1-arm64.dmg` - ARM64 installer
- `SpinneR-0.0.1.app` - Application bundle

See [BUILD-GUIDE.md](AI_docs/BUILD-GUIDE.md) for detailed build instructions.

## 🔐 Environment Variables

### Docker Mode (`.env.docker`)
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

PORT=3000
REQUEST_TIMEOUT=60000
```

### Electron Mode (`.env.electron`)
```bash
DB_TYPE=sqlite
DB_PATH=./data/spinner-dev.db
REDIS_ENABLED=false

PORT=3000
REQUEST_TIMEOUT=60000
NODE_ENV=development
```

### Creating Your Own
```bash
# Copy the appropriate template
cp .env.docker .env    # For Docker
cp .env.electron .env  # For Electron

# Edit as needed
nano .env
```

**Note**: `.env` files are gitignored. Template files (`.env.docker`, `.env.electron`) are safe to commit.

## 🔒 Security

### Production Dependencies
✅ **Zero vulnerabilities** - All production dependencies are secure and regularly audited.

```bash
npm audit --omit=dev
# Result: found 0 vulnerabilities
```

### Security Features
- **VM Sandboxing**: Post-request scripts run in isolated Node.js VM contexts
- **Pattern Validation**: Dangerous JavaScript patterns automatically blocked
- **Input Validation**: All inputs validated with class-validator
- **SQL Injection Protection**: TypeORM parameterized queries prevent SQL injection
- **No External Access**: Scripts cannot access filesystem or network
- **Environment Isolation**: Each script execution runs in isolated context

### NPM Overrides
We enforce secure versions of transitive dependencies:

```json
{
  "overrides": {
    "lodash": "^4.17.21",
    "tar": "^7.5.6",
    "electron": "^33.0.0"
  }
}
```

### Security Audit
```bash
# Audit production dependencies
npm audit --omit=dev

# Audit all dependencies
npm audit
```

For detailed security information, see [SECURITY.md](AI_docs/SECURITY.md)

## 📖 Documentation

Additional documentation files:

- [DUAL-MODE-GUIDE.md](./DUAL-MODE-GUIDE.md) - Comprehensive dual-mode development guide
- [ELECTRON-README.md](./ELECTRON-README.md) - Electron implementation details
- [BUILD-GUIDE.md](AI_docs/BUILD-GUIDE.md) - Building desktop applications
- [POST-REQUEST-SCRIPTS-GUIDE.md](AI_docs/POST-REQUEST-SCRIPTS-GUIDE.md) - Script automation guide
- [TESTING.md](AI_docs/TESTING.md) - Testing documentation
- [TESTS-README.md](AI_docs/TESTS-README.md) - Test setup and examples

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Use conventional commits
- Run linting before committing

### Code Quality
```bash
# Format code
npm run format

# Lint code
npm run lint

# Run all checks
npm run test:all
```

## 📝 Scripts Reference

```bash
# Development
npm run start              # Start NestJS (no watch)
npm run start:dev          # Start with auto-reload
npm run start:debug        # Start with debugging
npm run dev                # Alias for dev:docker
npm run dev:docker         # Docker mode
npm run dev:electron       # Electron mode

# Building
npm run build              # Build backend
npm run build:mac          # Build macOS app

# Testing
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # With coverage
npm run test:all           # All tests + lint

# Code Quality
npm run format             # Format with Prettier
npm run lint               # Lint with ESLint

# Electron
npm run electron:dev       # Electron dev mode
npm run electron:build     # Build Electron app
npm run electron:rebuild   # Rebuild native modules
```

## ⚡️ Performance

- **Startup time (Docker)**: ~30 seconds
- **Startup time (Electron)**: ~10 seconds
- **Request execution**: < 100ms overhead
- **Database queries**: Optimized with proper indexing
- **Memory usage**: ~150MB (Electron), ~200MB (Docker)


## 🐛 Known Issues

- Desktop app requires restart for code changes (no hot reload)
- Redis required for Docker mode queue processing
- Native modules need rebuilding after npm install

## 🗺 Roadmap

- [ ] Windows and Linux builds
- [ ] GraphQL request support
- [ ] Request authentication presets (OAuth, Bearer, etc.)
- [ ] Import from Postman/Insomnia
- [ ] WebSocket testing
- [ ] Response assertions
- [ ] Team collaboration features
- [ ] Cloud sync

## 📜 License

UNLICENSED - Private project

## 👨‍💻 Author

Serhii Vasylets

GIT:    https://github.com/ezhivas

email:  akvatonk@gmail.com

---

**Built with** ❤️ **using NestJS, Electron, and TypeScript**
