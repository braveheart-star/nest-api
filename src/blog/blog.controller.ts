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
} from "@nestjs/common";
import { Observable } from "rxjs";
import { BlogService } from "./blog.service";
import { BlogEntry } from "./blog-entry.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-guard";
import { UserIsAuthorGuard } from "./guards/user-is-author.guard";

@Controller("blog")
export class BlogController {
  constructor(private blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() blogEntry: BlogEntry, @Request() req): Observable<BlogEntry> {
    const user = req.user;
    return this.blogService.create(user, blogEntry);
  }

  @Get()
  findBlogEntries(@Query("userId") userId: number): Observable<BlogEntry[]> {
    if (userId === undefined) {
      return this.blogService.findAll();
    } else {
      return this.blogService.findByUser(userId);
    }
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
}
