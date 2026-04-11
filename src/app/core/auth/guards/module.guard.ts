import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

/**
 * Guard de acceso a módulos basado en `route.data['moduleId']` (número).
 *
 * - SuperAdmin / SystemAdmin / Admin / CompanyAdmin / HRManager → siempre tienen acceso.
 * - Otros roles → se verifica `enabledModuleIds` del usuario.
 *   - Si `enabledModuleIds` no está definido → acceso permitido (backwards-compat).
 *   - Si el moduleId no está en la lista → redirige a /home.
 */
export const ModuleGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    if (!auth.getToken()) {
        return router.parseUrl('welcome');
    }

    const moduleId = route.data?.['moduleId'] as number | undefined;
    if (moduleId === undefined) {
        return true; // no se configuró moduleId → sin restricción
    }

    const cachedUser = auth.getCurrentUser();
    if (cachedUser) {
        return auth.hasModuleAccess(moduleId) ? true : router.parseUrl('home');
    }

    return auth.ensureCurrentUserLoaded().pipe(
        switchMap(() => {
            return of(auth.hasModuleAccess(moduleId) ? true : router.parseUrl('home'));
        }),
        catchError(() => of(router.parseUrl('home')))
    );
};
