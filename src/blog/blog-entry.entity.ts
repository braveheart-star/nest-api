import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  BeforeUpdate,
} from "typeorm";
import { UserEntity } from "../user/user.entity";

@Entity("blog_entry")
export class BlogEntryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ default: "" })
  description: string;

  @Column({ default: "" })
  body: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @Column({ default: 0 })
  likes: number;

  @Column()
  headerImage: string;

  @Column()
  publishedDate: Date;

  @Column()
  isPublished: boolean;

  @ManyToOne(() => UserEntity, (user) => user.blogEntries)
  author: UserEntity;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
