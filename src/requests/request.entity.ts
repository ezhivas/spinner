import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { CollectionEntity } from '../collections/collection.entity';
import { EnumColumn } from '../common/decorators/enum-column.decorator';

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

  @EnumColumn({ enum: HttpMethod })
  method: HttpMethod;

  @Column()
  url: string;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  headers: Record<string, string>;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  queryParams: Record<string, string>;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  body: any;

  @Column({ type: 'varchar', nullable: true, default: 'json' })
  bodyType?: string;

  @Column({ nullable: true })
  collectionId?: number;

  @ManyToOne(() => CollectionEntity, (collection) => collection.requests, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  collection?: CollectionEntity | null;

  @Column({ type: 'text', nullable: true })
  preRequestScript?: string;

  @Column({ type: 'text', nullable: true })
  postRequestScript?: string;

  @CreateDateColumn()
  createdAt: Date;
}
