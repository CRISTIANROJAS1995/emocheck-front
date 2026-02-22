import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminAlertDto, AdminAlertsService, AlertStatisticsDto } from 'app/core/services/admin-alerts.service';
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

    // Filters — status values match API: OPEN | ACKNOWLEDGED | IN_PROGRESS | RESOLVED | DISMISSED
    statusFilter = '';
    // Severity values match API: LOW | MEDIUM | HIGH | CRITICAL
    levelFilter = '';

    alerts: AdminAlertDto[] = [];
    filteredAlerts: AdminAlertDto[] = [];
    stats: AlertStatisticsDto | null = null;
    selectedAlert: AdminAlertDto | null = null;

    // Resolve form
    resolution = '';

    // Sort
    sortField = 'createdAt';
    sortAsc = false;

    constructor(
        private readonly service: AdminAlertsService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void {
        this.load();
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
            filtered = filtered.filter(a =>
                (a.status ?? '').toUpperCase() === this.statusFilter.toUpperCase()
            );
        }
        if (this.levelFilter) {
            filtered = filtered.filter(a =>
                (a.alertLevel ?? '').toUpperCase() === this.levelFilter.toUpperCase()
            );
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

    severityBadgeClass(level: string | undefined): string {
        switch ((level ?? '').toUpperCase()) {
            case 'CRITICAL': return 'badge badge--danger';
            case 'HIGH':     return 'badge badge--warning';
            case 'MEDIUM':   return 'badge badge--info';
            case 'LOW':      return 'badge badge--success';
            default:         return 'badge badge--neutral';
        }
    }

    statusBadgeClass(status: string | undefined): string {
        switch ((status ?? '').toUpperCase()) {
            case 'OPEN':         return 'badge badge--danger';
            case 'ACKNOWLEDGED': return 'badge badge--warning';
            case 'IN_PROGRESS':  return 'badge badge--info';
            case 'RESOLVED':     return 'badge badge--success';
            case 'DISMISSED':    return 'badge badge--neutral';
            default:             return 'badge badge--neutral';
        }
    }

    statusLabel(status: string | undefined): string {
        switch ((status ?? '').toUpperCase()) {
            case 'OPEN':         return 'Abierta';
            case 'ACKNOWLEDGED': return 'Reconocida';
            case 'IN_PROGRESS':  return 'En Proceso';
            case 'RESOLVED':     return 'Resuelta';
            case 'DISMISSED':    return 'Descartada';
            default:             return status ?? 'Desconocido';
        }
    }

    severityLabel(level: string | undefined): string {
        switch ((level ?? '').toUpperCase()) {
            case 'CRITICAL': return 'Crítica';
            case 'HIGH':     return 'Alta';
            case 'MEDIUM':   return 'Media';
            case 'LOW':      return 'Baja';
            default:         return level ?? '-';
        }
    }
}
