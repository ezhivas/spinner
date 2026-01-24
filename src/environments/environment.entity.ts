import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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
  @Column({ type: 'jsonb' })
  variables: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;
}
