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

    const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'data', 'spinner.db');
    console.log(`📁 Database path: ${dbPath}`);

    return {
      type: 'sqlite',
      database: dbPath,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // ⚠️ IMPORTANT: In production, use migrations instead of synchronize
      synchronize: process.env.NODE_ENV !== 'production',
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
