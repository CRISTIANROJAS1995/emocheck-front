import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminAlertDto, AdminAlertsService, AlertStatisticsDto } from 'app/core/services/admin-alerts.service';
import { AdminUsersService } from 'app/core/services/admin-users.service';
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

    // Acknowledge form
    actionTaken = '';

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
    }

    load(): void {
        this.loading = true;
        forkJoin({
            alerts: this.service.list().pipe(catchError((err) => {
                console.error('[AdminAlerts] GET /alert error:', err?.status, err?.error ?? err?.message);
                return of([]);
            })),
            stats: this.service.getStatistics().pipe(catchError((err) => {
                console.error('[AdminAlerts] GET /alert/statistics error:', err?.status, err?.error ?? err?.message);
                return of(null);
            })),
        }).pipe(finalize(() => (this.loading = false)))
            .subscribe(({ alerts, stats }) => {
                this.stats = stats as AlertStatisticsDto;

                // Collect unique userIds to enrich with user names
                const uniqueUserIds = [...new Set(alerts.map(a => a.userId).filter((id): id is number => !!id))];

                if (uniqueUserIds.length === 0) {
                    this.alerts = alerts;
                    this.applyFilter();
                    return;
                }

                // Fetch user data for each unique userId in parallel
                const userRequests = uniqueUserIds.map(id =>
                    this.usersService.getUserById(id).pipe(catchError(() => of(null)))
                );

                forkJoin(userRequests).subscribe(users => {
                    // Build a lookup map: userId → user data
                    const userMap = new Map<number, { fullName: string; documentNumber?: string; email?: string; companyName?: string; areaName?: string }>();
                    users.forEach((u, i) => {
                        if (u) {
                            userMap.set(uniqueUserIds[i], {
                                fullName: u.fullName,
                                documentNumber: u.documentNumber,
                                email: u.email,
                                companyName: u.companyName,
                                areaName: u.areaName,
                            });
                        }
                    });

                    // Enrich each alert with user info
                    this.alerts = alerts.map(a => {
                        if (a.userId && userMap.has(a.userId)) {
                            const u = userMap.get(a.userId)!;
                            return {
                                ...a,
                                userName: u.fullName,
                                userDocumentNumber: u.documentNumber,
                                userEmail: u.email,
                                userCompany: u.companyName,
                                userArea: u.areaName,
                            };
                        }
                        return a;
                    });
                    this.applyFilter();
                });
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
        this.actionTaken = '';
    }

    acknowledgeAlert(alert: AdminAlertDto, actionTaken?: string): void {
        this.saving = true;
        this.service.acknowledge(alert.alertId, actionTaken)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta reconocida');
                    this.selectedAlert = null;
                    this.actionTaken = '';
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
            case 'IN_REVIEW':    return 'badge badge--info';
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
            case 'IN_REVIEW':    return 'En Revisión';
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
