import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Request,
  Res,
} from "@nestjs/common";

import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { FileInterceptor } from "@nestjs/platform-express";

import { UserService } from "./user.service";
import { User, UserRole } from "./user.interface";
import { hasRoles } from "../auth/decorator/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Pagination } from "nestjs-typeorm-paginate";

import path = require("path");
import { join } from "path";

import { diskStorage } from "multer";
import { v4 as uuidv4 } from "uuid";
import { UserIsUserGuard } from "./UserIsUser.guard";

export const storage = {
  storage: diskStorage({
    destination: "./uploads/profileImages",
    filename: (req, file, cb) => {
      const filename: string =
        // use regular express to remove whitespace
        path.parse(file.originalname).name.replace(/\s/g, "") + uuidv4();

      const extension: string = path.parse(file.originalname).ext;
      // call back
      cb(null, `${filename}${extension}`);
    },
  }),
};

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() user: User): Observable<User | any> {
    return this.userService.create(user).pipe(
      map((user: User) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Post("login")
  login(@Body() user: User): Observable<any> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { access_token: jwt };
      }),
    );
  }

  // @Get()
  // findAll(): Observable<User[]> {
  //   return this.userService.findAll();
  // }

  @Get()
  index(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("username") username: string,
  ): Observable<Pagination<User>> {
    limit = limit > 100 ? 100 : limit;

    if (username === null || username === undefined) {
      return this.userService.paginate({
        page: Number(page),
        limit: Number(limit),
        route: "http://localhost:3000/api/users",
      });
    } else {
      return this.userService.paginateFilterByUsername(
        {
          page: Number(page),
          limit: Number(limit),
          route: "http://localhost:3000/users",
        },
        { username },
      );
    }
  }

  @Get(":id")
  findOne(@Param() param): Observable<User> {
    return this.userService.findOne(param.id);
  }

  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(":id")
  deleteOne(@Param("id") id: string): Observable<User> {
    return this.userService.deleteOne(Number(id));
  }

  // user can only update his profile
  @UseGuards(JwtAuthGuard, UserIsUserGuard)
  @Put(":id")
  updateOne(@Param("id") id: string, @Body() user: User): Observable<any> {
    return this.userService.updateOne(Number(id), user);
  }

  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(":id/role")
  updateRoleOfUser(
    @Param("id") id: string,
    @Body() user: User,
  ): Observable<User> {
    return this.userService.updateRoleOfUser(Number(id), user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("upload")
  @UseInterceptors(FileInterceptor("file", storage))
  uploadFile(@UploadedFile() file, @Request() req): Observable<any> {
    const user: User = req.user;

    return this.userService
      .updateOne(user.id, { profileImage: file.filename })
      .pipe(
        tap((user: User) => console.log("user ==>", user)),
        map((user: User) => ({ profileImage: user.profileImage })),
      );
  }

  @Get("profile-image/:imageName")
  findProfileImage(@Param("imageName") imageName, @Res() res): Observable<any> {
    return of(
      res.sendFile(join(process.cwd(), `uploads/profileImages/${imageName}`)),
    );
  }
}
