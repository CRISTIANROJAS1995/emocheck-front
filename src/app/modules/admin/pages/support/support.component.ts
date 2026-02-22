import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SupportService, EmergencyContactDto, SupportRequestDto } from 'app/core/services/support.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, BackgroundCirclesComponent],
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
    myRequests: SupportRequestDto[] = [];

    // Formulario de nueva solicitud
    showForm = false;
    formSubject = '';
    formDescription = '';
    formPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    formError: string | null = null;

    readonly priorityOptions = [
        { value: 'LOW', label: 'Baja' },
        { value: 'MEDIUM', label: 'Media' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' },
    ];

    constructor(private readonly route: ActivatedRoute, private readonly support: SupportService) { }

    ngOnInit(): void {
        const rawId = this.route.snapshot.queryParamMap.get('evaluationResultId');
        this.evaluationResultId = rawId ? Number(rawId) : null;
        if (Number.isNaN(this.evaluationResultId as any)) this.evaluationResultId = null;

        const rawMode = (this.route.snapshot.queryParamMap.get('mode') ?? '').toLowerCase();
        this.mode = rawMode === 'emergency' ? 'emergency' : rawMode === 'chat' ? 'chat' : null;

        forkJoin({
            emergency: this.support.getEmergencyContacts().pipe(catchError(() => of([]))),
            my: this.support.getMyRequests().pipe(catchError(() => of([]))),
        })
            .pipe(finalize(() => { this.loading = false; }))
            .subscribe({
                next: ({ emergency, my }) => {
                    this.emergencyContacts = emergency;
                    this.myRequests = my;
                },
                error: () => {
                    this.error = 'No fue posible cargar la información de soporte';
                },
            });
    }

    call123(): void {
        try { window.open('tel:123', '_self'); } catch { /* ignore */ }
    }

    openForm(): void {
        this.showForm = true;
        this.formSubject = '';
        this.formDescription = '';
        this.formPriority = 'MEDIUM';
        this.formError = null;
        this.successMessage = null;
    }

    closeForm(): void {
        this.showForm = false;
        this.formError = null;
    }

    submitForm(): void {
        this.formError = null;

        if (!this.formSubject.trim()) {
            this.formError = 'El asunto es obligatorio.';
            return;
        }
        if (!this.formDescription.trim()) {
            this.formError = 'La descripción es obligatoria.';
            return;
        }

        this.submitting = true;
        this.support
            .createRequest({
                requestType: 'PSYCHOLOGICAL',
                priority: this.formPriority,
                subject: this.formSubject.trim(),
                description: this.formDescription.trim(),
                evaluationID: this.evaluationResultId ?? undefined,
            })
            .pipe(finalize(() => (this.submitting = false)))
            .subscribe({
                next: () => {
                    this.showForm = false;
                    this.successMessage = 'Solicitud creada correctamente. Un profesional te contactará pronto.';
                    this.reloadMyRequests();
                },
                error: (e) => {
                    this.formError = e?.error?.message
                        ?? e?.error?.title
                        ?? e?.message
                        ?? 'No fue posible crear la solicitud. Intenta de nuevo.';
                },
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
                    this.reloadMyRequests();
                },
                error: (e) => {
                    this.error = e?.error?.message
                        ?? e?.error?.title
                        ?? e?.message
                        ?? 'No fue posible crear la solicitud de emergencia';
                },
            });
    }

    statusLabel(status: string): string {
        switch ((status ?? '').toUpperCase()) {
            case 'OPEN': return 'Abierta';
            case 'IN_PROGRESS': return 'En proceso';
            case 'RESOLVED': return 'Resuelta';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    }

    statusTone(status: string): string {
        switch ((status ?? '').toUpperCase()) {
            case 'OPEN': return 'open';
            case 'IN_PROGRESS': return 'progress';
            case 'RESOLVED': return 'resolved';
            case 'CANCELLED': return 'cancelled';
            default: return '';
        }
    }

    priorityLabel(priority: string): string {
        switch ((priority ?? '').toUpperCase()) {
            case 'LOW': return 'Baja';
            case 'MEDIUM': return 'Media';
            case 'HIGH': return 'Alta';
            case 'URGENT': return 'Urgente';
            default: return priority;
        }
    }

    private reloadMyRequests(): void {
        this.support
            .getMyRequests()
            .pipe(catchError(() => of([])))
            .subscribe((items) => { this.myRequests = items; });
    }
}

