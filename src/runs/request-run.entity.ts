import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { JsonColumn } from '../common/decorators/json-column.decorator';

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
  status: 'PENDING' | 'SUCCESS' | 'ERROR';

  @Column({ nullable: true })
  responseStatus?: number;

  @JsonColumn({ nullable: true })
  responseHeaders?: any;

  @JsonColumn({ nullable: true })
  responseBody?: any;

  @Column({ nullable: true })
  durationMs?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;
}
