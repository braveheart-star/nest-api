import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { FileInterceptor } from "@nestjs/platform-express";
import { join } from "path";

import { BlogService } from "./blog.service";
import { BlogEntry } from "./blog-entry.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-guard";
import { UserIsAuthorGuard } from "./guards/user-is-author.guard";
import { storage } from "../user/user.controller";
import { BlogImage } from "./image.interface";

export const BLOG_URL = "http://localhost:3000/api/blog";

@Controller("blog")
export class BlogController {
  constructor(private blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() blogEntry: BlogEntry, @Request() req): Observable<BlogEntry> {
    const user = req.user;
    return this.blogService.create(user, blogEntry);
  }

  // @Get()
  // findBlogEntries(@Query("userId") userId: number): Observable<BlogEntry[]> {
  //   if (userId === undefined) {
  //     return this.blogService.findAll();
  //   } else {
  //     return this.blogService.findByUser(userId);
  //   }
  // }

  @Get("")
  index(@Query("page") page = 1, @Query("limit") limit = 10) {
    limit = limit > 100 ? 100 : limit;
    return this.blogService.paginateALl({
      limit: Number(limit),
      page: Number(page),
      route: BLOG_URL,
    });
  }

  @Get("user/:user")
  indexByUser(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Param("user") userId: number,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.blogService.paginateByUser(
      {
        limit: Number(limit),
        page: Number(page),
        route: BLOG_URL,
      },
      userId,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: number): Observable<BlogEntry> {
    return this.blogService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, UserIsAuthorGuard)
  @Put(":id")
  updateOne(
    @Param("id") id: number,
    @Body() blogEntry: BlogEntry,
  ): Observable<BlogEntry> {
    return this.blogService.updateOne(id, blogEntry);
  }

  @UseGuards(JwtAuthGuard, UserIsAuthorGuard)
  @Delete(":id")
  deleteOne(@Param("id") id: number): Observable<any> {
    return this.blogService.deleteOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("image/upload")
  @UseInterceptors(FileInterceptor("file", storage))
  uploadFile(@UploadedFile() file): Observable<BlogImage> {
    return of(file);
  }

  @Get("image/:imageName")
  findBlogImage(@Param("imageName") imageName, @Res() res): Observable<any> {
    return of(
      res.sendFile(join(process.cwd(), `uploads/profileImages/${imageName}`)),
    );
  }
}
