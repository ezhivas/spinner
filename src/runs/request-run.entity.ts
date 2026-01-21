import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';

@Entity('request_runs')
export class RequestRunEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RequestEntity, { eager: true })
  request: RequestEntity;

  @ManyToOne(() => EnvironmentEntity, {
    nullable: true,
    eager: true,
  })
  environment?: EnvironmentEntity;

  @Column()
  status: 'SUCCESS' | 'ERROR';

  @Column({ nullable: true })
  responseStatus?: number;

  @Column({ type: 'jsonb', nullable: true })
  responseHeaders?: any;

  @Column({ type: 'jsonb', nullable: true })
  responseBody?: any;

  @Column({ nullable: true })
  durationMs?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;
}
