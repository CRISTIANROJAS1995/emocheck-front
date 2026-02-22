import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

function normalizeRole(role: string): string {
    return (role ?? '').trim().toLowerCase();
}

function hasAnyRole(userRoles: string[] | null | undefined, requiredRoles: string[]): boolean {
    if (!requiredRoles?.length) return true;
    const userSet = new Set((userRoles ?? []).map(normalizeRole));
    return requiredRoles.some((r) => userSet.has(normalizeRole(r)));
}

/**
 * Guard de roles basado en `route.data.roles`.
 * - Si no hay token → /sign-in
 * - Si el usuario no tiene el rol → /home
 * - Si ya tiene el usuario en memoria → verificación síncrona (sin HTTP)
 * - Si aún no cargó el usuario → espera a ensureCurrentUserLoaded()
 */
export const RoleGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    // 1. Verificación síncrona de token
    if (!auth.getToken()) {
        const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
        return router.parseUrl(`sign-in?${redirectURL}`);
    }

    const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

    // 2. Si el usuario ya está en memoria, verificar roles sin HTTP
    const cachedUser = auth.getCurrentUser();
    if (cachedUser) {
        return hasAnyRole(cachedUser.roles, requiredRoles)
            ? true
            : router.parseUrl('/home');
    }

    // 3. Usuario no cargado aún → esperar la rehidratación (ya disparada en initializeAuth)
    return auth.ensureCurrentUserLoaded().pipe(
        switchMap((user) => {
            const userRoles = user?.roles ?? [];
            return of(
                hasAnyRole(userRoles, requiredRoles)
                    ? true
                    : router.parseUrl('/home')
            );
        }),
        catchError(() => {
            // Solo redirigir a sign-in si realmente no hay token
            if (!auth.getToken()) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                return of(router.parseUrl(`sign-in?${redirectURL}`));
            }
            // Si hay token pero falló la carga del usuario (ej: red lenta),
            // dejar pasar para no expulsar al usuario innecesariamente.
            return of(true);
        })
    );
};
