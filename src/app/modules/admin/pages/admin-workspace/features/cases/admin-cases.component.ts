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
    allUsers: AdminUserListItemDto[] = [];

    // New follow-up form
    newFollowUpNotes = '';

    // Sort
    sortField = 'caseTrackingId';
    sortAsc = false;

    // Create form
    form: CreateCaseTrackingDto = {
        alertId: 0,
        userId: undefined,
        assignedToUserID: 0,
        priority: 'MEDIUM',
        description: '',
    };

    // Edit form
    editStatus = '';
    editAssignedToUserID: number | null = null;
    editPriority = '';

    // Close reason
    closeReason = '';

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
            this.allUsers = users;
            this.psychologists = users.filter(u =>
                (u.roles ?? []).some(r => r.toLowerCase().includes('psychologist') || r.toLowerCase().includes('psicólogo'))
            );
            // If no psychologist role found, show all users as fallback
            if (this.psychologists.length === 0) {
                this.psychologists = users;
            }
        });
    }

    /** Cuando se selecciona una alerta, pre-rellena el userId con el usuario de la alerta */
    onAlertChange(): void {
        const alertId = this.form.alertId;
        if (!alertId) return;
        const alert = this.alerts.find(a => a.alertId === alertId);
        if (alert?.userId && typeof alert.userId === 'number') {
            this.form.userId = alert.userId;
        }
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
        this.editStatus = c.status || 'OPEN';
        this.editAssignedToUserID = c.assignedToPsychologistId ?? null;
        this.editPriority = c.priority || 'MEDIUM';
        this.closeReason = '';
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
        this.service.update(this.selectedCase.caseTrackingId, {
            status: this.editStatus,
            assignedToUserID: this.editAssignedToUserID ?? undefined,
            priority: this.editPriority || undefined,
        })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Caso actualizado'); this.selectedCase = null; this.load(); },
                error: (e) => this.notify.error(e?.message || 'Error al actualizar caso'),
            });
    }

    closeCase(): void {
        if (!this.selectedCase) return;
        this.saving = true;
        this.service.close(this.selectedCase.caseTrackingId, this.closeReason.trim() || undefined)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Caso cerrado'); this.selectedCase = null; this.load(); },
                error: (e) => this.notify.error(e?.message || 'Error al cerrar caso'),
            });
    }

    createCase(): void {
        if (!this.form.alertId || !this.form.userId || !this.form.assignedToUserID || !this.form.description) {
            this.notify.warning('Completa todos los campos obligatorios (alerta, usuario afectado, psicólogo y descripción)');
            return;
        }
        this.saving = true;
        this.service.create(this.form)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso creado');
                    this.form = { alertId: 0, userId: undefined, assignedToUserID: 0, priority: 'MEDIUM', description: '' };
                    this.activeTab = 'list';
                    this.load();
                },
                error: (e) => {
                    const body = e?.error;
                    const msg = body?.Message || body?.message || body?.title || e?.message || 'Error al crear caso';
                    this.notify.error(msg);
                },
            });
    }

    get openCount(): number { return this.cases.filter(c => (c.status ?? '').toUpperCase() === 'OPEN').length; }
    get inProgressCount(): number { return this.cases.filter(c => (c.status ?? '').toUpperCase() === 'IN_PROGRESS').length; }
    get closedCount(): number { return this.cases.filter(c => ['CLOSED', 'ESCALATED'].includes((c.status ?? '').toUpperCase())).length; }

    priorityBadge(p: string | undefined): string {
        switch ((p ?? '').toUpperCase()) {
            case 'CRITICAL': return 'badge badge--danger';
            case 'HIGH':     return 'badge badge--warning';
            case 'MEDIUM':   return 'badge badge--info';
            case 'LOW':      return 'badge badge--success';
            default:         return 'badge badge--neutral';
        }
    }

    statusBadge(s: string | undefined): string {
        switch ((s ?? '').toUpperCase()) {
            case 'OPEN':        return 'badge badge--warning';
            case 'IN_PROGRESS': return 'badge badge--info';
            case 'ESCALATED':   return 'badge badge--danger';
            case 'CLOSED':      return 'badge badge--neutral';
            default:            return 'badge badge--neutral';
        }
    }

    statusLabel(s: string | undefined): string {
        switch ((s ?? '').toUpperCase()) {
            case 'OPEN':        return 'Abierto';
            case 'IN_PROGRESS': return 'En Proceso';
            case 'ESCALATED':   return 'Escalado';
            case 'CLOSED':      return 'Cerrado';
            default:            return s ?? '-';
        }
    }

    priorityLabel(p: string | undefined): string {
        switch ((p ?? '').toUpperCase()) {
            case 'CRITICAL': return 'Crítica';
            case 'HIGH':     return 'Alta';
            case 'MEDIUM':   return 'Media';
            case 'LOW':      return 'Baja';
            default:         return p ?? '-';
        }
    }
}
