import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';

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

@Entity('request_runs')
export class RequestRunEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RequestEntity, { onDelete: 'CASCADE' })
  request: RequestEntity;

  @ManyToOne(() => EnvironmentEntity, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  environment?: EnvironmentEntity;

  @Column()
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

  @Column({ nullable: true })
  responseStatus?: number;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  responseHeaders?: any;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  responseBody?: any;

  @Column({ nullable: true })
  durationMs?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;
}
