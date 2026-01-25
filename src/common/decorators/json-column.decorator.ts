import { Column, ColumnOptions } from 'typeorm';

/**
 * Universal JSON column decorator that works with both PostgreSQL and SQLite
 *
 * Usage:
 * @JsonColumn({ nullable: true })
 * headers: Record<string, string>;
 *
 * This decorator automatically selects:
 * - 'jsonb' for PostgreSQL (native JSON support)
 * - 'simple-json' for SQLite (stores as TEXT with JSON serialization)
 */
export function JsonColumn(options?: ColumnOptions) {
  return function (target: any, propertyKey: string) {
    const dbType = process.env.DB_TYPE || 'postgres';

    const columnOptions: ColumnOptions = {
      ...options,
      type: dbType === 'sqlite' ? 'simple-json' : 'jsonb',
    };

    return Column(columnOptions)(target, propertyKey);
  };
}
