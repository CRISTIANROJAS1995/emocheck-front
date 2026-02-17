import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import {
    AdminCaseTrackingService,
    CaseTrackingDto,
    CreateCaseTrackingDto,
} from 'app/core/services/admin-case-tracking.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-cases',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule],
    templateUrl: './admin-cases.component.html',
    styleUrls: ['./admin-cases.component.scss'],
})
export class AdminCasesComponent implements OnInit {
    loading = false;
    saving = false;
    status = '';
    priority = '';
    cases: CaseTrackingDto[] = [];
    selectedCaseId: number | null = null;
    editStatus = 'InProgress';
    editProgressNotes = '';

    form: CreateCaseTrackingDto = {
        alertId: 0,
        userId: undefined,
        assignedToPsychologistId: 0,
        priority: 'Medium',
        initialAssessment: '',
        interventionPlan: '',
    };

    constructor(private readonly service: AdminCaseTrackingService, private readonly notify: AlertService) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.service
            .list({
                status: this.status || undefined,
                priority: this.priority || undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => (this.cases = rows),
                error: (e) => this.notify.error(e?.message || 'No fue posible cargar casos'),
            });
    }

    create(): void {
        if (!this.form.alertId || !this.form.assignedToPsychologistId || !this.form.initialAssessment || !this.form.interventionPlan) {
            this.notify.warning('Completa todos los campos obligatorios para crear el caso');
            return;
        }

        this.saving = true;
        this.service
            .create(this.form)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso creado correctamente');
                    this.form = {
                        alertId: 0,
                        userId: undefined,
                        assignedToPsychologistId: 0,
                        priority: 'Medium',
                        initialAssessment: '',
                        interventionPlan: '',
                    };
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'No fue posible crear el caso'),
            });
    }

    selectCase(row: CaseTrackingDto): void {
        this.selectedCaseId = row.caseTrackingId;
        this.editStatus = row.status || 'InProgress';
        this.editProgressNotes = row.progressNotes || '';
    }

    clearSelection(): void {
        this.selectedCaseId = null;
        this.editStatus = 'InProgress';
        this.editProgressNotes = '';
    }

    updateSelectedCase(): void {
        const row = this.selectedCase;
        if (!row) {
            this.notify.warning('Selecciona un caso para actualizar');
            return;
        }
        if (!this.editStatus.trim() || !this.editProgressNotes.trim()) {
            this.notify.warning('Estado y notas de progreso son obligatorios');
            return;
        }

        this.saving = true;
        this.service
            .update(row.caseTrackingId, {
                status: this.editStatus.trim(),
                progressNotes: this.editProgressNotes.trim(),
            })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso actualizado');
                    this.clearSelection();
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'No fue posible actualizar el caso'),
            });
    }

    closeSelectedCase(): void {
        const row = this.selectedCase;
        if (!row) {
            this.notify.warning('Selecciona un caso para cerrar');
            return;
        }

        this.saving = true;
        this.service
            .close(row.caseTrackingId)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso cerrado');
                    this.clearSelection();
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'No fue posible cerrar el caso'),
            });
    }

    get selectedCase(): CaseTrackingDto | null {
        if (this.selectedCaseId === null) return null;
        return this.cases.find((x) => x.caseTrackingId === this.selectedCaseId) || null;
    }
}
