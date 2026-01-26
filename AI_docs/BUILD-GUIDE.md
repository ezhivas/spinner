# 🏗️ Build & Package Guide - Stage 6

## Quick Start

### Development Build (Test Packaging)

```bash
# Build backend and package app (no installer)
npm run pack

# Result: release/mac/SpinneR.app
```

### Production Build

```bash
# Build for current architecture
npm run build:mac

# Build for Apple Silicon (ARM64)
npm run build:mac:arm64

# Build for Intel (x64)
npm run build:mac:x64

# Results in release/:
# - SpinneR-0.0.1.dmg (installer)
# - SpinneR-0.0.1-mac.zip (portable)
# - SpinneR-0.0.1-arm64-mac.zip (Apple Silicon)
# - SpinneR-0.0.1-mac.zip (Intel)
```

## Build Process

The build process consists of:

1. **Backend compilation** (`npm run build`)
   - TypeScript → JavaScript
   - Output: `dist/` directory

2. **Electron packaging** (`electron-builder`)
   - Bundles backend, frontend, and Electron runtime
   - Creates macOS app bundle (.app)
   - Creates DMG installer
   - Creates ZIP archive

## Directory Structure After Build

```
api-client-backend/
├── dist/                    # Compiled backend (TypeScript → JS)
│   ├── main.js
│   ├── config/
│   ├── queue/
│   └── ...
├── release/                 # Electron builds
│   ├── mac/
│   │   └── SpinneR.app     # macOS application
│   ├── SpinneR-0.0.1.dmg   # DMG installer
│   └── SpinneR-0.0.1-mac.zip # ZIP archive
└── build/                   # Build assets (icons, etc.)
```

## Testing the Build

### 1. Test Pack (Quick Test)

```bash
npm run pack
```

This creates an unpacked app in `release/mac/SpinneR.app` without creating an installer. Fastest way to test.

**To run:**
```bash
open release/mac/SpinneR.app
```

### 2. Test DMG Installer

```bash
npm run build:mac
```

**To test:**
```bash
# Mount and open DMG
open release/SpinneR-0.0.1.dmg

# Drag app to Applications
# Then run from Applications folder
```

### 3. Test ZIP Archive

```bash
npm run build:mac
```

**To test:**
```bash
# Extract ZIP
unzip release/SpinneR-0.0.1-mac.zip -d /tmp/spinner-test

# Run app
open /tmp/spinner-test/SpinneR.app
```

## Troubleshooting

### Build Fails with "Cannot find module"

**Problem**: Backend not compiled

**Solution**:
```bash
npm run build:backend
```

### Build Fails with "better-sqlite3 not compatible"

**Problem**: Native modules not rebuilt for Electron

**Solution**:
```bash
npm run electron:rebuild
npm run pack
```

### DMG Creation Fails

**Problem**: Missing icon or background

**Solution**: Comment out icon/background in `electron-builder.yml` (already done)

### App Crashes on Launch

**Problem**: Backend can't find database or dependencies

**Solution**: Check `electron/main.js` paths are correct

## Build Configuration

All build settings are in `electron-builder.yml`:

```yaml
appId: com.spinner.api-client
productName: SpinneR

# What to include
files:
  - dist/**/*        # Compiled backend
  - public/**/*      # Frontend
  - electron/**/*    # Electron code
  - node_modules/**/* # Dependencies

# macOS settings
mac:
  target:
    - dmg
    - zip
  category: public.app-category.developer-tools
```

## Size Optimization

Current build size: ~150-200 MB (includes Node.js + Chromium + dependencies)

### To reduce size:

1. **Remove dev dependencies from production:**
   ```bash
   npm prune --production
   npm run pack
   ```

2. **Use asar archive** (already enabled):
   - Packs all app files into single archive
   - Reduces file count, improves load time

3. **Exclude unnecessary files:**
   Edit `electron-builder.yml`:
   ```yaml
   files:
     - "!**/*.map"      # Exclude source maps
     - "!**/*.spec.ts"  # Exclude tests
   ```

## Distribution Checklist

Before distributing to users:

- [ ] App icon created (`build/icon.icns`)
- [ ] Version updated in `package.json`
- [ ] Tested on clean macOS machine
- [ ] All features working
- [ ] Database migration tested
- [ ] Backup/restore tested
- [ ] Error handling tested
- [ ] Code signed (optional but recommended)
- [ ] Notarized (required for macOS 10.15+)

## Next Steps

After successful build:

1. **Stage 7**: Set up dual development mode (Docker + Electron)
2. **Stage 8**: Distribution setup (code signing, auto-updates)

## Common Commands Reference

```bash
# Development
npm run dev:electron          # Run in Electron mode
npm run dev:docker           # Run in Docker mode

# Building
npm run build                # Build backend only
npm run pack                 # Quick package test
npm run build:mac            # Full production build

# Maintenance
npm run electron:rebuild     # Rebuild native modules
npm run clean                # Clean build artifacts (add this script)
```

## Notes

- First build takes 5-10 minutes (downloads Electron runtime)
- Subsequent builds are faster (cached)
- Build size: ~150-200 MB (normal for Electron apps)
- DMG creation requires macOS
- Code signing requires Apple Developer ID ($99/year)

---

**Status**: Stage 6 ready for testing!  
**Next**: Test packaging with `npm run pack`
