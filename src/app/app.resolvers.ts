import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/services/auth.service';
import { switchMap, forkJoin, catchError, of } from 'rxjs';

export const initialDataResolver = () => {
    const navigationService = inject(NavigationService);
    const userService = inject(UserService);
    const authService = inject(AuthService);

    // Primero asegurar que el usuario esté cargado (con roles),
    // luego construir navegación basada en esos roles.
    // catchError: si falla la carga del usuario (ej: red lenta en refresh),
    // intentamos construir la navegación con lo que haya en caché.
    return authService.ensureCurrentUserLoaded().pipe(
        catchError(() => of(null)),
        switchMap(() =>
            forkJoin([
                navigationService.get(),
                userService.get(),
            ])
        )
    );
};
