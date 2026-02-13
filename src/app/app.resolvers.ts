import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { forkJoin } from 'rxjs';

export const initialDataResolver = () => {
    const navigationService = inject(NavigationService);
    const userService = inject(UserService);

    // Fork join multiple API endpoint calls to wait all of them to finish
    return forkJoin([
        navigationService.get(),
        userService.get(),
    ]);
};
