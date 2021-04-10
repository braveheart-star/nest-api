import {
  CanActivate,
  Inject,
  Injectable,
  forwardRef,
  ExecutionContext,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { User } from "./user.interface";
import { UserService } from "./user.service";

@Injectable()
export class UserIsUserGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const user: User = request.user.user;
    console.log(
      "🚀 ~ file: UserIsUser.guard.ts ~ line 22 ~ UserIsUserGuard ~ params",
      params,
    );

    return this.userService.findOne(user.id).pipe(
      map((user: User) => {
        let hasPermission = false;
        if (user.id === Number(params.id)) {
          hasPermission = true;
        }
        return user && hasPermission;
      }),
    );
  }
}
