import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RequestEntity } from '../requests/request.entity';

@Entity('collections')
export class CollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => RequestEntity, (request) => request.collection, {
    cascade: true,
  })
  requests: RequestEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
