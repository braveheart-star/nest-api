import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { User } from "./user.interface";
import { hasRoles } from "../auth/decorator/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-guard";
import { RolesGuard } from "../auth/guards/roles.guard";

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

  @hasRoles("Admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(): Observable<User[]> {
    return this.userService.findAll();
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
}
