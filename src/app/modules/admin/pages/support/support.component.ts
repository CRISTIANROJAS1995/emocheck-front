import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, BackgroundCirclesComponent],
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
    loading = true;
    error: string | null = null;

    evaluationResultId: number | null = null;
    mode: 'emergency' | 'chat' | null = null;

    emergencyContacts: EmergencyContactDto[] = [];
    myRequests: SupportRequestDto[] = [];

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
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
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
        try {
            window.open('tel:123', '_self');
        } catch {
            // ignore
        }
    }

    createEmergencyRequest(): void {
        this.loading = true;
        this.support
            .createRequest({
                requestType: 'PSYCHOLOGICAL',
                priority: 'URGENT',
                subject: 'Solicitud de ayuda inmediata',
                description: 'El resultado indica alto riesgo. Requiero apoyo urgente.',
                evaluationID: this.evaluationResultId ?? undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: () => {
                    this.reloadMyRequests();
                    window.alert('Solicitud creada. Un profesional te contactará pronto.');
                },
                error: (e) => {
                    this.error = e?.message || 'No fue posible crear la solicitud';
                },
            });
    }

    createChatRequest(): void {
        this.loading = true;
        this.support
            .createRequest({
                requestType: 'PSYCHOLOGICAL',
                priority: 'HIGH',
                subject: 'Solicitud de apoyo psicológico',
                description: 'Me gustaría recibir orientación y acompañamiento.',
                evaluationID: this.evaluationResultId ?? undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: () => {
                    this.reloadMyRequests();
                    window.alert('Solicitud creada. Un profesional te contactará pronto.');
                },
                error: (e) => {
                    this.error = e?.message || 'No fue posible crear la solicitud';
                },
            });
    }

    private reloadMyRequests(): void {
        this.support
            .getMyRequests()
            .pipe(catchError(() => of([])))
            .subscribe((items) => {
                this.myRequests = items;
            });
    }
}
