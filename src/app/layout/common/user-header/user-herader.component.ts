import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { User } from 'app/core/models/auth.model'; // 🔧 NUESTRO MODELO
import { AuthService } from 'app/core/services/auth.service'; // 🔧 NUESTRO SERVICIO
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-header',
    standalone: true,
    templateUrl: './user-header.component.html',
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatRippleModule,
        MatButtonModule,
    ],
})
export class UserHeaderComponent implements OnInit, OnDestroy {
    user: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _authService: AuthService // 🔧 NUESTRO SERVICIO
    ) { }

    ngOnInit(): void {
        // 🔧 Usar nuestro AuthService
        this._authService.currentUser$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
