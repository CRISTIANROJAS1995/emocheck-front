import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { ConsentService } from 'app/core/services/consent.service';
import { UsersService } from 'app/core/services/users.service';
import { catchError, map, of, switchMap, take } from 'rxjs';

@Component({
    selector: 'auth-signed-in-redirect',
    standalone: true,
    template: '',
})
export class SignedInRedirectComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly auth: AuthService,
        private readonly usersService: UsersService,
        private readonly consentService: ConsentService
    ) { }

    ngOnInit(): void {
        this.auth
            .ensureCurrentUserLoaded()
            .pipe(
                take(1),
                switchMap((user) => {
                    const roles = user?.roles ?? [];
                    const isSystemAdmin = roles.includes('SystemAdmin');
                    const isEmployee = roles.includes('Employee');

                    // Only SystemAdmin can bypass everything.
                    if (isSystemAdmin) return of('/home');

                    // Everyone else: Consent -> Profile -> (Employee => Instructions) else Home.
                    return this.consentService.hasAccepted().pipe(
                        take(1),
                        switchMap((hasAccepted) => {
                            if (!hasAccepted) return of('/informed-consent');

                            return this.usersService.getMyProfile().pipe(
                                take(1),
                                map((profile) => {
                                    // While site/area/job type lookup endpoints are pending,
                                    // treat profile as complete if the backend has a document number.
                                    const isProfileComplete = !!profile?.documentNumber;

                                    if (!isProfileComplete) return '/complete-profile';
                                    return isEmployee ? '/emotional-instructions' : '/home';
                                }),
                                catchError(() => of('/complete-profile'))
                            );
                        }),
                        catchError(() => of('/informed-consent'))
                    );
                }),
                catchError(() => of('/sign-in'))
            )
            .subscribe((target) => {
                this.router.navigateByUrl(target);
            });
    }
}
