import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import {
    AdminCaseTrackingService,
    CaseTrackingDto,
    CreateCaseTrackingDto,
    FollowUpDto,
    CreateFollowUpDto,
} from 'app/core/services/admin-case-tracking.service';
import { AdminAlertDto, AdminAlertsService } from 'app/core/services/admin-alerts.service';
import { AdminUserListItemDto, AdminUsersService } from 'app/core/services/admin-users.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

type TabId = 'list' | 'create';

@Component({
    selector: 'app-admin-cases',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-cases.component.html',
    styleUrls: ['./admin-cases.component.scss'],
})
export class AdminCasesComponent implements OnInit {
    loading = false;
    saving = false;

    activeTab: TabId = 'list';
    statusFilter = '';
    priorityFilter = '';
    searchText = '';

    cases: CaseTrackingDto[] = [];
    filteredCases: CaseTrackingDto[] = [];
    selectedCase: CaseTrackingDto | null = null;
    followUps: FollowUpDto[] = [];
    followUpLoading = false;

    // Dropdown data
    alerts: AdminAlertDto[] = [];
    psychologists: AdminUserListItemDto[] = [];

    // New follow-up form
    newFollowUpNotes = '';

    // Sort
    sortField = 'caseTrackingId';
    sortAsc = false;

    // Create form
    form: CreateCaseTrackingDto = {
        alertId: 0,
        userId: undefined,
        assignedToPsychologistId: 0,
        priority: 'Medium',
        initialAssessment: '',
        interventionPlan: '',
    };

    // Edit form
    editStatus = '';
    editNotes = '';

    constructor(
        private readonly service: AdminCaseTrackingService,
        private readonly alertsService: AdminAlertsService,
        private readonly usersService: AdminUsersService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void {
        this.load();
        this.loadDropdownData();
    }

    loadDropdownData(): void {
        forkJoin({
            alerts: this.alertsService.list().pipe(catchError(() => of([]))),
            users: this.usersService.listUsers().pipe(catchError(() => of([]))),
        }).subscribe(({ alerts, users }) => {
            this.alerts = alerts;
            this.psychologists = users.filter(u =>
                (u.roles ?? []).some(r => r.toLowerCase().includes('psychologist') || r.toLowerCase().includes('psicólogo'))
            );
            // If no psychologist role found, show all users as fallback
            if (this.psychologists.length === 0) {
                this.psychologists = users;
            }
        });
    }

    load(): void {
        this.loading = true;
        this.service.list({ status: this.statusFilter || undefined, priority: this.priorityFilter || undefined })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => { this.cases = rows; this.applyFilter(); },
                error: () => this.notify.error('No fue posible cargar casos'),
            });
    }

    applyFilter(): void {
        let filtered = this.cases;
        const q = this.searchText.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(c =>
                `${c.caseNumber ?? ''} ${c.userName ?? ''} ${c.userInitials ?? ''} ${c.assignedToPsychologistName ?? ''}`
                    .toLowerCase().includes(q)
            );
        }
        filtered = [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '');
            const bVal = String((b as any)[this.sortField] ?? '');
            const cmp = aVal.localeCompare(bVal);
            return this.sortAsc ? cmp : -cmp;
        });
        this.filteredCases = filtered;
    }

    toggleSort(field: string): void {
        if (this.sortField === field) { this.sortAsc = !this.sortAsc; } else { this.sortField = field; this.sortAsc = true; }
        this.applyFilter();
    }

    sortClass(field: string): string {
        if (this.sortField !== field) return '';
        return this.sortAsc ? 'sorted-asc' : 'sorted-desc';
    }

    selectCase(c: CaseTrackingDto): void {
        if (this.selectedCase?.caseTrackingId === c.caseTrackingId) {
            this.selectedCase = null;
            this.followUps = [];
            return;
        }
        this.selectedCase = c;
        this.editStatus = c.status || 'Open';
        this.editNotes = c.progressNotes || '';
        this.loadFollowUps(c.caseTrackingId);
    }

    loadFollowUps(caseId: number): void {
        this.followUpLoading = true;
        this.service.getFollowUps(caseId)
            .pipe(finalize(() => (this.followUpLoading = false)))
            .subscribe(rows => (this.followUps = rows));
    }

    addFollowUp(): void {
        if (!this.selectedCase || !this.newFollowUpNotes.trim()) {
            this.notify.warning('Escribe una nota para el seguimiento');
            return;
        }
        this.saving = true;
        const payload: CreateFollowUpDto = { notes: this.newFollowUpNotes.trim() };
        this.service.createFollowUp(this.selectedCase.caseTrackingId, payload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Seguimiento agregado');
                    this.newFollowUpNotes = '';
                    this.loadFollowUps(this.selectedCase!.caseTrackingId);
                },
                error: (e) => this.notify.error(e?.message || 'Error al agregar seguimiento'),
            });
    }

    updateCase(): void {
        if (!this.selectedCase) return;
        this.saving = true;
        this.service.update(this.selectedCase.caseTrackingId, { status: this.editStatus, progressNotes: this.editNotes })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Caso actualizado'); this.selectedCase = null; this.load(); },
                error: (e) => this.notify.error(e?.message || 'Error al actualizar caso'),
            });
    }

    closeCase(): void {
        if (!this.selectedCase) return;
        this.saving = true;
        this.service.close(this.selectedCase.caseTrackingId)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Caso cerrado'); this.selectedCase = null; this.load(); },
                error: (e) => this.notify.error(e?.message || 'Error al cerrar caso'),
            });
    }

    createCase(): void {
        if (!this.form.alertId || !this.form.assignedToPsychologistId || !this.form.initialAssessment || !this.form.interventionPlan) {
            this.notify.warning('Completa todos los campos obligatorios');
            return;
        }
        this.saving = true;
        this.service.create(this.form)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso creado');
                    this.form = { alertId: 0, userId: undefined, assignedToPsychologistId: 0, priority: 'Medium', initialAssessment: '', interventionPlan: '' };
                    this.activeTab = 'list';
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al crear caso'),
            });
    }

    get openCount(): number { return this.cases.filter(c => c.status === 'Open').length; }
    get inProgressCount(): number { return this.cases.filter(c => c.status === 'InProgress').length; }
    get closedCount(): number { return this.cases.filter(c => c.status === 'Closed' || c.status === 'Resolved').length; }

    priorityBadge(p: string | undefined): string {
        switch ((p ?? '').toLowerCase()) {
            case 'critical': return 'badge badge--danger';
            case 'high': return 'badge badge--warning';
            case 'medium': return 'badge badge--info';
            case 'low': return 'badge badge--success';
            default: return 'badge badge--neutral';
        }
    }

    statusBadge(s: string | undefined): string {
        switch ((s ?? '').toLowerCase()) {
            case 'open': return 'badge badge--warning';
            case 'inprogress': return 'badge badge--info';
            case 'resolved': return 'badge badge--success';
            case 'closed': return 'badge badge--neutral';
            default: return 'badge badge--neutral';
        }
    }
}
