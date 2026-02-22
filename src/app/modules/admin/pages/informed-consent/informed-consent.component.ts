import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackgroundCirclesInvertedComponent } from 'app/shared/components/ui/background-circles-inverted/background-circles-inverted.component';
import { AuthService } from 'app/core/services/auth.service';
import { ConsentService } from 'app/core/services/consent.service';
import { UsersService } from 'app/core/services/users.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { catchError, of, switchMap, take } from 'rxjs';

@Component({
    selector: 'app-informed-consent',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BackgroundCirclesInvertedComponent],
    templateUrl: './informed-consent.component.html',
    styleUrls: ['./informed-consent.component.scss']
})
export class InformedConsentComponent implements OnInit {
    consentForm: FormGroup;
    userName: string = 'Usuario';
    userDocumentNumber: string = '';
    showFullConsent: boolean = false;

    constructor(
        private _formBuilder: FormBuilder,
        private _router: Router,
        private readonly authService: AuthService,
        private readonly consentService: ConsentService,
        private readonly usersService: UsersService,
        private readonly alert: AlertService
    ) {
        this.consentForm = this._formBuilder.group({
            acceptConsent: [false, Validators.requiredTrue]
        });
    }

    ngOnInit(): void {
        // Carga inmediata desde caché
        const cached = this.authService.getCurrentUser();
        if (cached?.name) {
            this.userName = cached.name;
        }

        // Cargar perfil completo para obtener nombre + número de documento
        this.usersService.getMyProfile().pipe(take(1)).subscribe({
            next: (profile) => {
                if (profile.fullName) {
                    this.userName = profile.fullName;
                }
                this.userDocumentNumber = profile.documentNumber || '';
            },
            error: () => {
                // Si falla getMyProfile, intentar con authService
                this.authService
                    .ensureCurrentUserLoaded()
                    .pipe(take(1))
                    .subscribe({
                        next: (u) => { this.userName = u?.name || this.userName; },
                        error: () => { /* mantener valor en caché */ },
                    });
            },
        });
    }

    toggleFullConsent(event: Event): void {
        event.preventDefault();
        this.showFullConsent = !this.showFullConsent;
    }

    continueWithRegistration(): void {
        if (this.consentForm.valid) {
            // Backend expects AcceptConsentDto; consent text is shown to the user but not sent.
            this.consentService.accept().subscribe({
                next: () => {
                    this.consentService.hasAccepted().subscribe({
                        next: (ok) => {
                            if (ok) {
                                this.authService
                                    .ensureCurrentUserLoaded()
                                    .pipe(
                                        take(1),
                                        switchMap((user) => {
                                            const roles = user?.roles ?? [];
                                            const isSystemAdmin = roles.includes('SystemAdmin');
                                            const isEmployee = roles.includes('Employee');
                                            if (isSystemAdmin) return of('/home');

                                            // Profile is completed by admin during user creation.
                                            return of(isEmployee ? '/emotional-instructions' : '/home');
                                        }),
                                        catchError(() => of('/home'))
                                    )
                                    .subscribe((target) => this._router.navigateByUrl(target));
                            } else {
                                this.alert.error('El servidor no registró el consentimiento. Intenta de nuevo.');
                            }
                        },
                        error: (e) => {
                            const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible validar el consentimiento';
                            this.alert.error(msg);
                        },
                    });
                },
                error: (e) => {
                    const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible aceptar el consentimiento';
                    this.alert.error(msg);
                },
            });
        }
    }
}
