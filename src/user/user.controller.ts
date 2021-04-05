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
} from "@nestjs/common";

import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { UserService } from "./user.service";
import { User, UserRole } from "./user.interface";
import { hasRoles } from "../auth/decorator/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Pagination } from "nestjs-typeorm-paginate";

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
  ): Observable<Pagination<User>> {
    limit = limit > 100 ? 100 : limit;
    return this.userService.paginate({
      page: Number(page),
      limit: Number(limit),
      route: "http://localhost:3000/users",
    });
  }

  @Get(":id")
  findOne(@Param() param): Observable<User> {
    return this.userService.findOne(param.id);
  }

  @Delete(":id")
  deleteOne(@Param("id") id: string): Observable<User> {
    return this.userService.deleteOne(Number(id));
  }

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
}
