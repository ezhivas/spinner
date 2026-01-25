import { Column, ColumnOptions } from 'typeorm';

/**
 * Universal enum column decorator that works with both PostgreSQL and SQLite
 *
 * Usage:
 * @EnumColumn({ enum: HttpMethod })
 * method: HttpMethod;
 *
 * This decorator automatically selects:
 * - 'enum' for PostgreSQL (native ENUM support)
 * - 'text' for SQLite (stores as TEXT with validation in application layer)
 */
export function EnumColumn(options: ColumnOptions & { enum: any }) {
  return function (target: any, propertyKey: string) {
    const dbType = process.env.DB_TYPE || 'postgres';

    if (dbType === 'sqlite') {
      // SQLite doesn't support enum, use text instead
      const { enum: enumType, ...restOptions } = options;
      const columnOptions: ColumnOptions = {
        ...restOptions,
        type: 'text',
      };
      return Column(columnOptions)(target, propertyKey);
    } else {
      // PostgreSQL supports native enum
      return Column(options)(target, propertyKey);
    }
  };
}
