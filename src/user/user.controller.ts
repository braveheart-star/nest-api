import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { User } from "./user.interface";

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
  @Get(":id")
  findOne(@Param() param): Observable<User> {
    return this.userService.findOne(param.id);
  }

  @Get()
  findAll(): Observable<User[]> {
    return this.userService.findAll();
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
