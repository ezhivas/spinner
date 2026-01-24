import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { CollectionEntity } from '../collections/collection.entity';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: HttpMethod,
  })
  method: HttpMethod;

  @Column()
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  queryParams: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  body: any;

  @ManyToOne(() => CollectionEntity, (collection) => collection.requests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  collection?: CollectionEntity;

  @CreateDateColumn()
  createdAt: Date;
}
