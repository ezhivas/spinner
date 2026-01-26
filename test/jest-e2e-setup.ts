// E2E test setup
// Set environment variables before tests run
process.env.DB_TYPE = 'postgres';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'test_db';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_ENABLED = process.env.REDIS_ENABLED || 'true';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for E2E tests

console.log('🧪 E2E Test Environment:');
console.log(`  DB: ${process.env.DB_TYPE} @ ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);
console.log(`  Redis: ${process.env.REDIS_ENABLED === 'true' ? 'Enabled' : 'Disabled'} @ ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
