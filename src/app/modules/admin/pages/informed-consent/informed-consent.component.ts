import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackgroundCirclesInvertedComponent } from 'app/shared/components/ui/background-circles-inverted/background-circles-inverted.component';
import { AuthService } from 'app/core/services/auth.service';
import { ConsentService } from 'app/core/services/consent.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { UsersService } from 'app/core/services/users.service';
import { catchError, map, of, switchMap, take } from 'rxjs';

@Component({
    selector: 'app-informed-consent',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BackgroundCirclesInvertedComponent],
    templateUrl: './informed-consent.component.html',
    styleUrls: ['./informed-consent.component.scss']
})
export class InformedConsentComponent {
    consentForm: FormGroup;
    userName: string = 'Usuario';
    showFullConsent: boolean = false;
    private readonly consentText =
        'CONSENTIMIENTO INFORMADO PARA EVALUACIÓN DE SALUD MENTAL Y BIENESTAR LABORAL. ' +
        'Declaro que he sido informado/a sobre los objetivos, procedimientos, beneficios y riesgos de la evaluación de salud mental y factores psicosociales a través de la plataforma EmoCheck. ' +
        'Entiendo que mi participación es voluntaria y que puedo retirarme en cualquier momento sin consecuencias negativas. ' +
        'Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, exclusivamente para fines de promoción de salud mental, prevención de riesgos psicosociales y mejora del clima organizacional. ' +
        'Entiendo y acepto que los resultados son de orientación y acompañamiento profesional y no constituyen un diagnóstico clínico.';

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

        const user = this.authService.getCurrentUser();
        this.userName = user?.name || 'Usuario';

        // On fast redirects after login, the user may not be loaded yet.
        // Ensure we greet with the real backend user (/users/current).
        this.authService
            .ensureCurrentUserLoaded()
            .pipe(take(1))
            .subscribe({
                next: (u) => {
                    this.userName = u?.name || this.userName;
                },
                error: () => {
                    // keep default
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

                                            return this.usersService.getMyProfile().pipe(
                                                take(1),
                                                map((profile) => {
                                                    const isProfileComplete = !!profile?.documentNumber;
                                                    if (!isProfileComplete) return '/complete-profile';
                                                    return isEmployee ? '/emotional-instructions' : '/home';
                                                }),
                                                catchError(() => of('/complete-profile'))
                                            );
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
