import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { JsonColumn } from '../common/decorators/json-column.decorator';

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
  @JsonColumn()
  variables: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;
}
