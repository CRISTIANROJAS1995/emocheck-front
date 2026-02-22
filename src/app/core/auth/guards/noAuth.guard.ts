import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (
    route,
    state
) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Si ya hay token activo, redirigir al home según el rol del usuario.
    if (authService.getToken()) {
        return router.parseUrl('/signed-in-redirect');
    }

    return true;
};
