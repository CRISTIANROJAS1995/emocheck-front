import { BooleanInput } from '@angular/cdk/coercion';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { User as MotionIQUser } from 'app/core/models/auth.model'; // 🔧 NUESTRO MODELO USER
import { AuthService } from 'app/core/services/auth.service'; // 🔧 NUESTRO AUTHSERVICE
import { UserService } from 'app/core/user/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    imports: [
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatDividerModule,
        RouterModule,
    ],
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: MotionIQUser; // 🔧 USAR NUESTRO MODELO

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _authService: AuthService // 🔧 AGREGAR NUESTRO AUTHSERVICE
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // 🔧 Subscribe to our AuthService instead of UserService
        this._authService.currentUser$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: MotionIQUser) => {
                this.user = user;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void {
        // 🔧 TODO: Implementar actualización de status con nuestro backend

        // Return if user is not available
        if (!this.user) {
            return;
        }

        // 🔧 Por ahora solo stub, implementar cuando tengamos endpoint
    }

    /**
     * Sign out
     */
    signOut(): void {
        // 🔧 Usar nuestro logout
        this._authService.logout();
        this._router.navigate(['/sign-out']);
    }

    /**
     * Get user initials
     */
    getInitials(): string {
        if (!this.user?.name) {
            return 'MG';
        }
        const names = this.user.name.split(' ');
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
        }
        return this.user.name.substring(0, 2).toUpperCase();
    }
}
