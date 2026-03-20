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

function getFallbackUrl(roles: string[] | null | undefined): string {
    const r = roles ?? [];
    if (r.some(x => normalizeRole(x) === 'psychologist')) return '/home';
    if (r.some(x => ['admin', 'companyadmin', 'systemadmin', 'superadmin'].includes(normalizeRole(x)))) return '/admin';
    return '/home';
}

/**
 * Guard de roles basado en `route.data.roles`.
 * - Si no hay token → /sign-in
 * - Si el usuario no tiene el rol → fallback según su rol (Psychologist→/home, Admin→/admin, resto→/home)
 * - Si ya tiene el usuario en memoria → verificación síncrona (sin HTTP)
 * - Si aún no cargó el usuario → espera a ensureCurrentUserLoaded()
 */
export const RoleGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    // 1. Verificación síncrona de token
    if (!auth.getToken()) {
        return router.parseUrl('welcome');
    }

    const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

    // 2. Si el usuario ya está en memoria, verificar roles sin HTTP
    const cachedUser = auth.getCurrentUser();
    if (cachedUser) {
        return hasAnyRole(cachedUser.roles, requiredRoles)
            ? true
            : router.parseUrl(getFallbackUrl(cachedUser.roles));
    }

    // 3. Usuario no cargado aún → esperar la rehidratación (ya disparada en initializeAuth)
    return auth.ensureCurrentUserLoaded().pipe(
        switchMap((user) => {
            const userRoles = user?.roles ?? [];
            return of(
                hasAnyRole(userRoles, requiredRoles)
                    ? true
                    : router.parseUrl(getFallbackUrl(userRoles))
            );
        }),
        catchError(() => {
            // Solo redirigir a /welcome si realmente no hay token
            if (!auth.getToken()) {
                return of(router.parseUrl('welcome'));
            }
            // Si hay token pero falló la carga del usuario (ej: red lenta),
            // dejar pasar para no expulsar al usuario innecesariamente.
            return of(true);
        })
    );
};
