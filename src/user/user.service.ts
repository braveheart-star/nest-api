import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from "nestjs-typeorm-paginate";

import { from, Observable, throwError } from "rxjs";
import { switchMap, catchError, map } from "rxjs/operators";

import { AuthService } from "../auth/auth.service";
import { UserEntity } from "./user.entity";
import { User, UserRole } from "./user.interface";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}

  create(user: User): Observable<User> {
    return this.authService.hashPassword(user.password).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.username = user.username;
        newUser.email = user.email;
        newUser.password = passwordHash;
        newUser.role = UserRole.USER;

        return from(this.userRepository.save(newUser)).pipe(
          map((user: User) => {
            // extract password from return value
            // eslint-disable-next-line
            const { password, ...result } = user;
            return result;
          }),
          catchError((err) => throwError(err)),
        );
      }),
    );
  }

  findOne(id: number): Observable<User> {
    return from(this.userRepository.findOne({ id })).pipe(
      map((user: User) => {
        // eslint-disable-next-line
        const { password, ...result } = user;
        return result;
      }),
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find()).pipe(
      map((users: User[]) => {
        // remove property from array object
        users.forEach(function (v) {
          delete v.password;
        });
        return users;
      }),
    );
  }
  paginate(options: IPaginationOptions): Observable<Pagination<User>> {
    return from(paginate<User>(this.userRepository, options)).pipe(
      map((paginatedUsers: Pagination<User>) => {
        paginatedUsers.items.forEach(function (v) {
          delete v.password;
        });
        return paginatedUsers;
      }),
    );
  }

  paginateFilterByUsername(
    options: IPaginationOptions,
    user: User,
  ): Observable<Pagination<User>> {
    return from(
      this.userRepository.findAndCount({
        skip: Number(options.page) * Number(options.limit) || 0,
        take: Number(options.limit) || 10,
        order: { id: "ASC" },
        select: ["id", "name", "username", "email", "role"],
        where: [{ username: Like(`%${user.username}%`) }],
      }),
    ).pipe(
      map(([users, totalUsers]) => {
        const paginatedUsers: Pagination<User> = {
          items: users,
          links: {
            first: options.route + `?limit`,
            previous: options.route + ``,
            next:
              options.route +
              `?limit=${options.limit}&page=${Number(options.page) + 1}`,
            last:
              options.route +
              `?limit=${options.limit}&page=${Math.ceil(
                totalUsers / Number(options.limit),
              )}`,
          },
          meta: {
            currentPage: Number(options.page),
            itemCount: users.length,
            itemsPerPage: Number(options.limit),
            totalItems: totalUsers,
            totalPages: Math.ceil(totalUsers / Number(options.limit)),
          },
        };
        return paginatedUsers;
      }),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.userRepository.delete(id));
  }

  updateOne(id: number, user: User): Observable<any> {
    // make user not change password or email directly using api, they should have link or whatever for changing their email & password
    delete user.email;
    delete user.password;
    delete user.role;

    return from(this.userRepository.update(id, user));
  }

  login(user: User): Observable<string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: User) => {
        if (user) {
          return this.authService
            .generateJWT(user)
            .pipe(map((jwt: string) => jwt));
        } else return "Wrong Credentials";
      }),
    );
  }
  validateUser(email: string, password: string): Observable<User> {
    return this.findByMail(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePassword(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              // eslint-disable-next-line
              const { password, ...result } = user;
              return result;
            } else throw Error;
          }),
        ),
      ),
    );
  }

  findByMail(email: string): Observable<User> {
    return from(this.userRepository.findOne({ email }));
  }

  updateRoleOfUser(id: number, user: User): Observable<any> {
    return from(this.userRepository.update(id, user));
  }
}
