import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { CollectionEntity } from '../collections/collection.entity';
import { JsonColumn } from '../common/decorators/json-column.decorator';

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

  @JsonColumn({ nullable: true })
  headers: Record<string, string>;

  @JsonColumn({ nullable: true })
  queryParams: Record<string, string>;

  @JsonColumn({ nullable: true })
  body: any;

  @Column({ nullable: true })
  collectionId?: number;

  @ManyToOne(() => CollectionEntity, (collection) => collection.requests, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  collection?: CollectionEntity | null;

  @CreateDateColumn()
  createdAt: Date;
}
