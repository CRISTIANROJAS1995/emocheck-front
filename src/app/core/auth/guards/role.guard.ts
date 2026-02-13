import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
 * - Si no hay `data.roles`, permite.
 * - Si el usuario no tiene el rol, redirige a `/home`.
 */
export const RoleGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

    return auth.isAuthenticated$.pipe(
        switchMap((authenticated) => {
            if (!authenticated) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                return of(router.parseUrl(`sign-in?${redirectURL}`));
            }

            return auth.ensureCurrentUserLoaded().pipe(
                switchMap((user) => {
                    const userRoles = user?.roles ?? [];
                    if (!hasAnyRole(userRoles, requiredRoles)) {
                        return of(router.parseUrl('/home'));
                    }
                    return of(true);
                }),
                catchError(() => {
                    const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                    return of(router.parseUrl(`sign-in?${redirectURL}`));
                })
            );
        })
    );
};
