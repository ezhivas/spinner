import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

/**
 * Database configuration factory
 * Automatically selects PostgreSQL or SQLite based on environment
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  const isElectron = process.env.DB_TYPE === 'sqlite';

  if (isElectron) {
    // SQLite for Electron mode
    console.log('🔧 Database: SQLite (Electron mode)');

    // IMPORTANT: Always use DB_PATH from environment (set by electron/main.js)
    // Fallback to userData-like path (not inside app bundle - no write permissions there!)
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
      console.error('❌ ERROR: DB_PATH not set! This will fail when running from DMG.');
      console.error('   Electron main.js must set DB_PATH to app.getPath("userData")');
      throw new Error('DB_PATH environment variable is required for Electron mode');
    }

    console.log(`📁 Database path: ${dbPath}`);

    return {
      type: 'sqlite',
      database: dbPath,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // For SQLite in Electron, always synchronize to auto-create tables
      // This is safe for SQLite as it's a local file database
      synchronize: true,
      logging: process.env.LOG_DB_QUERIES === 'true',
    };
  } else {
    // PostgreSQL for Docker (development)
    console.log('🔧 Database: PostgreSQL (Docker mode)');

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'api_client',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: process.env.LOG_DB_QUERIES === 'true',
    };
  }
}
