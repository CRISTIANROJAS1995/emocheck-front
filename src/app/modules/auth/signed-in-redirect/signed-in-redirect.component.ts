import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { ConsentService } from 'app/core/services/consent.service';
import { catchError, of, switchMap, take } from 'rxjs';

@Component({
    selector: 'auth-signed-in-redirect',
    standalone: true,
    template: '',
})
export class SignedInRedirectComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly auth: AuthService,
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
                    const isAdmin = roles.includes('Admin') || roles.includes('CompanyAdmin');
                    const isEmployee = roles.includes('Employee');

                    // Admin roles go straight to admin panel.
                    if (isSystemAdmin || isAdmin) return of('/admin');

                    // Everyone else: Consent -> (Employee => Instructions) else Home.
                    // Profile is completed by admin during user creation, no need to check here.
                    return this.consentService.hasAccepted().pipe(
                        take(1),
                        switchMap((hasAccepted) => {
                            if (!hasAccepted) return of('/informed-consent');
                            return of(isEmployee ? '/emotional-instructions' : '/home');
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
