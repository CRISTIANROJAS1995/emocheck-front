import { inject, Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { catchError, map, Observable, ReplaySubject, tap, throwError } from 'rxjs';
import { UsersService } from 'app/core/services/users.service';
import { AuthService } from 'app/core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _usersService = inject(UsersService);
    private _authService = inject(AuthService);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {
        return this._usersService.getMyProfile().pipe(
            map((profile) => {
                const user: User = {
                    id: String(profile.userId),
                    name: profile.fullName,
                    email: profile.email,
                    avatar: undefined,
                    status: profile.stateName,
                };
                return user;
            }),
            catchError((err) => {
                if (err?.status === 401) {
                    this._authService.logout();
                }
                return throwError(() => err);
            }),
            tap((user) => this._user.next(user))
        );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._usersService
            .updateMyProfile({
                fullName: user.name,
                email: user.email,
            })
            .pipe(
                map((profile) => {
                    const next: User = {
                        id: String(profile.userId),
                        name: profile.fullName,
                        email: profile.email,
                        status: profile.stateName,
                    };
                    this._user.next(next);
                    return next;
                })
            );
    }
}
