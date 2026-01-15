import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service'; // 🔧 USAR NUESTRO AUTHSERVICE
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Check the authentication status usando nuestro servicio
    return authService.isAuthenticated$.pipe(
        switchMap((authenticated) => {
            if (!authenticated) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                return of(urlTree);
            }
            return of(true);
        })
    );
};
