import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service'; // 🔧 USAR NUESTRO AUTHSERVICE
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (
    route,
    state
) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Check the authentication status usando nuestro servicio
    return authService.isAuthenticated$.pipe(
        switchMap((authenticated) => {
                if (authenticated) {
                    return of(router.parseUrl('/home'));
            }
            return of(true);
        })
    );
};
