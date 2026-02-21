import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/services/auth.service';
import { switchMap, forkJoin } from 'rxjs';

export const initialDataResolver = () => {
    const navigationService = inject(NavigationService);
    const userService = inject(UserService);
    const authService = inject(AuthService);

    // First ensure the current user (with roles) is loaded,
    // THEN build navigation based on those roles.
    return authService.ensureCurrentUserLoaded().pipe(
        switchMap(() =>
            forkJoin([
                navigationService.get(),
                userService.get(),
            ])
        )
    );
};
