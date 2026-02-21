import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminAlertDto, AdminAlertsService, AlertStatisticsDto } from 'app/core/services/admin-alerts.service';
import { AdminUserListItemDto, AdminUsersService } from 'app/core/services/admin-users.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-alerts',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-alerts.component.html',
    styleUrls: ['./admin-alerts.component.scss'],
})
export class AdminAlertsComponent implements OnInit {
    loading = false;
    saving = false;

    // Filters
    statusFilter = '';
    levelFilter = '';

    alerts: AdminAlertDto[] = [];
    filteredAlerts: AdminAlertDto[] = [];
    stats: AlertStatisticsDto | null = null;
    selectedAlert: AdminAlertDto | null = null;

    // Resolve form
    resolution = '';

    // Assign form
    psychologists: AdminUserListItemDto[] = [];
    assignToUserId: number | null = null;

    // Sort
    sortField = 'createdAt';
    sortAsc = false;

    constructor(
        private readonly service: AdminAlertsService,
        private readonly usersService: AdminUsersService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void {
        this.load();
        this.loadPsychologists();
    }

    loadPsychologists(): void {
        this.usersService.listUsers().pipe(catchError(() => of([]))).subscribe(users => {
            this.psychologists = users.filter(u =>
                (u.roles ?? []).some(r => r.toLowerCase().includes('psychologist') || r.toLowerCase().includes('psicólogo'))
            );
            if (this.psychologists.length === 0) {
                this.psychologists = users;
            }
        });
    }

    load(): void {
        this.loading = true;
        forkJoin({
            alerts: this.service.list().pipe(catchError(() => of([]))),
            stats: this.service.getStatistics().pipe(catchError(() => of(null))),
        }).pipe(finalize(() => (this.loading = false)))
            .subscribe(({ alerts, stats }) => {
                this.alerts = alerts;
                this.stats = stats as AlertStatisticsDto;
                this.applyFilter();
            });
    }

    applyFilter(): void {
        let filtered = this.alerts;
        if (this.statusFilter) {
            if (this.statusFilter === 'Pending') {
                filtered = filtered.filter(a => !a.isAttended);
            } else if (this.statusFilter === 'Attended') {
                filtered = filtered.filter(a => a.isAttended);
            }
        }
        if (this.levelFilter) {
            filtered = filtered.filter(a => (a.alertLevel ?? '').toLowerCase() === this.levelFilter.toLowerCase());
        }
        // Sort
        filtered = [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '');
            const bVal = String((b as any)[this.sortField] ?? '');
            const cmp = aVal.localeCompare(bVal);
            return this.sortAsc ? cmp : -cmp;
        });
        this.filteredAlerts = filtered;
    }

    toggleSort(field: string): void {
        if (this.sortField === field) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortField = field;
            this.sortAsc = field === 'alertId';
        }
        this.applyFilter();
    }

    sortClass(field: string): string {
        if (this.sortField !== field) return '';
        return this.sortAsc ? 'sorted-asc' : 'sorted-desc';
    }

    selectAlert(alert: AdminAlertDto): void {
        this.selectedAlert = this.selectedAlert?.alertId === alert.alertId ? null : alert;
        this.resolution = '';
    }

    acknowledgeAlert(alert: AdminAlertDto): void {
        this.saving = true;
        this.service.acknowledge(alert.alertId)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta reconocida');
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al reconocer alerta'),
            });
    }

    resolveAlert(): void {
        if (!this.selectedAlert) return;
        this.saving = true;
        this.service.resolve(this.selectedAlert.alertId, { resolution: this.resolution.trim() || undefined })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta resuelta');
                    this.selectedAlert = null;
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al resolver alerta'),
            });
    }

    assignAlert(): void {
        if (!this.selectedAlert || !this.assignToUserId) {
            this.notify.warning('Selecciona un psicólogo para asignar');
            return;
        }
        this.saving = true;
        this.service.assign(this.selectedAlert.alertId, { assignedToUserId: this.assignToUserId })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta asignada exitosamente');
                    this.assignToUserId = null;
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al asignar alerta'),
            });
    }

    severityBadgeClass(level: string | undefined): string {
        switch ((level ?? '').toLowerCase()) {
            case 'critical': return 'badge badge--danger';
            case 'high': return 'badge badge--warning';
            case 'medium': return 'badge badge--info';
            case 'low': return 'badge badge--success';
            default: return 'badge badge--neutral';
        }
    }

    statusBadgeClass(isAttended: boolean): string {
        return isAttended ? 'badge badge--success' : 'badge badge--warning';
    }
}
