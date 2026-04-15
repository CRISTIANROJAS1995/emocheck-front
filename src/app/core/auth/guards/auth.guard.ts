import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Verificación síncrona directa: si hay token en localStorage la sesión es válida.
    // La rehidratación del usuario ocurre en background (initializeAuth).
    // Si el token está expirado/inválido, el error de la API llamará a logout() y
    // redirigirá a /welcome automáticamente.
    const hasToken = !!authService.getToken();

    if (!hasToken) {
        return router.parseUrl('welcome');
    }

    return true;
};
