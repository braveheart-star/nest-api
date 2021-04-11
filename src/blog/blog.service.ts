import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  IPaginationOptions,
  paginate,
  Pagination,
} from "nestjs-typeorm-paginate";

import slugify from "slugify";

import { from, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { BlogEntry } from "./blog-entry.interface";
import { BlogEntryEntity } from "./blog-entry.entity";
import { User } from "../user/user.interface";

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogEntryEntity)
    private readonly blogRepository: Repository<BlogEntryEntity>,
  ) {}
  create(user: User, blogEntry: BlogEntry): Observable<BlogEntry> {
    blogEntry.author = user;
    return this.generateSlug(blogEntry.title).pipe(
      switchMap((slug: string) => {
        blogEntry.slug = slug;
        return from(this.blogRepository.save(blogEntry));
      }),
    );
  }

  findAll(): Observable<BlogEntry[]> {
    return from(
      this.blogRepository.find({
        relations: ["author"],
      }),
    );
  }

  paginateALl(options: IPaginationOptions): Observable<Pagination<BlogEntry>> {
    return from(
      paginate<BlogEntry>(this.blogRepository, options, {
        relations: ["author"],
      }),
    ).pipe(map((blogEntries: Pagination<BlogEntry>) => blogEntries));
  }

  paginateByUser(
    options: IPaginationOptions,
    userId: number,
  ): Observable<Pagination<BlogEntry>> {
    return from(
      paginate<BlogEntry>(this.blogRepository, options, {
        relations: ["author"],
        where: [{ author: userId }],
      }),
    ).pipe(map((blogEntries: Pagination<BlogEntry>) => blogEntries));
  }

  findOne(id: number): Observable<BlogEntry> {
    return from(this.blogRepository.findOne({ id }, { relations: ["author"] }));
  }

  findByUser(userId: number): Observable<BlogEntry[]> {
    return from(
      this.blogRepository.find({
        where: {
          author: userId,
        },
        relations: ["author"],
      }),
    ).pipe(map((blogEntries: BlogEntry[]) => blogEntries));
  }

  updateOne(id: number, blogEntry: BlogEntry): Observable<BlogEntry> {
    return from(this.blogRepository.update(id, blogEntry)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.blogRepository.delete(id));
  }

  generateSlug(title: string): Observable<string> {
    return of(slugify(title));
  }
}
