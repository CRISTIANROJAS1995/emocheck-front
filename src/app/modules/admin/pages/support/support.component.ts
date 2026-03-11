import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SupportService, EmergencyContactDto } from 'app/core/services/support.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, BackgroundCirclesComponent],
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
    loading = true;
    submitting = false;
    error: string | null = null;
    successMessage: string | null = null;

    evaluationResultId: number | null = null;
    mode: 'emergency' | 'chat' | null = null;

    emergencyContacts: EmergencyContactDto[] = [];

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    /** Número en formato internacional sin + ni espacios, ej: 573001234567 */
    readonly whatsappNumber = '573175930202';
    readonly whatsappDisplay = '+57 317 593 0202';

    get whatsappUrl(): string {
        const text = encodeURIComponent(
            'Hola! Me comunico desde EmoCheck y necesito apoyo psicologico.'
        );
        return `https://wa.me/${this.whatsappNumber}?text=${text}`;
    }

    constructor(private readonly route: ActivatedRoute, private readonly support: SupportService) { }

    ngOnInit(): void {
        const rawId = this.route.snapshot.queryParamMap.get('evaluationResultId');
        this.evaluationResultId = rawId ? Number(rawId) : null;
        if (Number.isNaN(this.evaluationResultId as any)) this.evaluationResultId = null;

        const rawMode = (this.route.snapshot.queryParamMap.get('mode') ?? '').toLowerCase();
        this.mode = rawMode === 'emergency' ? 'emergency' : rawMode === 'chat' ? 'chat' : null;

        this.support.getEmergencyContacts()
            .pipe(
                catchError(() => of([])),
                finalize(() => { this.loading = false; })
            )
            .subscribe(() => {
                // La sección de emergencias muestra información estática de EmoCheck.
                // Se ignora la respuesta del backend para siempre mostrar los contactos fijos.
                this.emergencyContacts = [];
            });
    }

    call123(): void {
        try { window.open('tel:123', '_self'); } catch { /* ignore */ }
    }

    openCalendly(): void {
        (window as any).Calendly?.initPopupWidget({
            url: 'https://calendly.com/cristianjoseroj0410/30min',
        });
    }

    createEmergencyRequest(): void {
        this.submitting = true;
        this.support
            .createRequest({
                requestType: 'PSYCHOLOGICAL',
                priority: 'URGENT',
                subject: 'Solicitud de ayuda inmediata',
                description: 'El resultado indica alto riesgo. Requiero apoyo urgente.',
                evaluationID: this.evaluationResultId ?? undefined,
            })
            .pipe(finalize(() => (this.submitting = false)))
            .subscribe({
                next: () => {
                    this.successMessage = 'Solicitud de emergencia creada. Un profesional te contactará pronto.';
                },
                error: (e) => {
                    this.error = e?.error?.message
                        ?? e?.error?.title
                        ?? e?.message
                        ?? 'No fue posible crear la solicitud de emergencia';
                },
            });
    }
}
