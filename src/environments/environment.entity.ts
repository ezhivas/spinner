import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

const jsonTransformer = {
  to: (value: any) => {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  from: (value: string) => {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  },
};

@Entity('environments')
export class EnvironmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  /**
   * Example:
   * {
   *   "BASE_URL": "https://api.example.com",
   *   "TOKEN": "abc123"
   * }
   */
  @Column({ type: 'text', transformer: jsonTransformer })
  variables: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;
}
