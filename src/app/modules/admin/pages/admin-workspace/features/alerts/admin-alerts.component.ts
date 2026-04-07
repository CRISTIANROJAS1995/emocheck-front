import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminAlertDto, AdminAlertsService, AlertStatisticsDto } from 'app/core/services/admin-alerts.service';
import { AdminCaseTrackingService, CaseTrackingDto, CreateCaseTrackingDto, FollowUpDto } from 'app/core/services/admin-case-tracking.service';
import { AdminUserListItemDto, AdminUsersService } from 'app/core/services/admin-users.service';
import { AuthService } from 'app/core/auth/auth.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

type DetailTab = 'alert' | 'case' | 'followups';

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

    // Sort
    sortField = 'createdAt';
    sortAsc = false;

    // Resolve (alerta)
    resolution = '';

    // ── Modal: Detalle completo (alerta + caso + seguimientos) ─────────────
    showDetailModal = false;
    detailAlert: AdminAlertDto | null = null;
    detailTab: DetailTab = 'alert';

    detailCase: CaseTrackingDto | null = null;
    detailCaseLoading = false;

    followUps: FollowUpDto[] = [];
    followUpsLoading = false;
    newFollowUpNotes = '';

    // Editar caso desde el detalle
    editCaseStatus = '';
    editCasePriority = '';
    closeReason = '';

    // ── Modal: Reconocer + Crear Caso ─────────────────────────────────────
    showAcknowledgeModal = false;
    modalAlert: AdminAlertDto | null = null;
    psychologists: AdminUserListItemDto[] = [];
    psychologistsLoading = false;

    modalForm: {
        actionTaken: string;
        assignedToUserID: number | null;
        priority: string;
        description: string;
    } = {
        actionTaken: '',
        assignedToUserID: null,
        priority: 'HIGH',
        description: '',
    };

    // Deprecated — kept for resolve
    selectedAlert: AdminAlertDto | null = null;
    actionTaken = '';

    constructor(
        private readonly service: AdminAlertsService,
        private readonly usersService: AdminUsersService,
        private readonly caseService: AdminCaseTrackingService,
        private readonly notify: AlertService,
        private readonly authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;

        const currentUser = this.authService.getCurrentUser();
        const roles = (currentUser?.roles ?? []).map(r => r.trim().toLowerCase());
        const isSuper = roles.some(r => r === 'superadmin' || r === 'systemadmin');
        const isCompanyScoped = !isSuper && roles.some(r => r === 'companyadmin' || r === 'hrmanager');

        // CompanyAdmin & HRManager: use /alert/my-company (company derived from JWT)
        if (isCompanyScoped) {
            this.service.list()
                .pipe(
                    finalize(() => (this.loading = false)),
                    catchError((err) => {
                        console.error('[AdminAlerts] GET /alert/my-company error:', err?.status, err?.error ?? err?.message);
                        return of([]);
                    })
                )
                .subscribe((alerts) => {
                    this.stats = this.service.computeStatsFromAlerts(alerts);
                    this.enrichAndSet(alerts);
                });
            return;
        }

        // SuperAdmin: full list + statistics
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
                this.enrichAndSet(alerts);
            });
    }

    private enrichAndSet(alerts: AdminAlertDto[]): void {
        const uniqueUserIds = [...new Set(alerts.map(a => a.userId).filter((id): id is number => !!id))];

        if (uniqueUserIds.length === 0) {
            this.alerts = alerts;
            this.applyFilter();
            return;
        }

        const userRequests = uniqueUserIds.map(id =>
            this.usersService.getUserById(id).pipe(catchError(() => of(null)))
        );

        forkJoin(userRequests).subscribe(users => {
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

    // ── Modal Detalle ──────────────────────────────────────────────────────

    openDetailModal(alert: AdminAlertDto, event: Event): void {
        event.stopPropagation();
        this.detailAlert = alert;
        this.detailTab = 'alert';
        this.detailCase = null;
        this.followUps = [];
        this.newFollowUpNotes = '';
        this.resolution = '';
        this.showDetailModal = true;

        // Buscar el caso asociado a esta alerta
        this.loadCaseForAlert(alert.alertId);
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.detailAlert = null;
        this.detailCase = null;
        this.followUps = [];
    }

    setDetailTab(tab: DetailTab): void {
        this.detailTab = tab;
        if (tab === 'followups' && this.detailCase && this.followUps.length === 0) {
            this.loadFollowUps(this.detailCase.caseTrackingId);
        }
    }

    loadCaseForAlert(alertId: number): void {
        this.detailCaseLoading = true;
        // Buscamos en todos los casos el que tenga este alertId
        this.caseService.list().pipe(
            catchError(() => of([])),
            finalize(() => (this.detailCaseLoading = false)),
        ).subscribe(cases => {
            const found = cases.find(c => c.alertId === alertId) ?? null;
            this.detailCase = found;
            if (found) {
                this.editCaseStatus = found.status ?? 'OPEN';
                this.editCasePriority = found.priority ?? 'MEDIUM';
                this.closeReason = '';
            }
        });
    }

    loadFollowUps(caseId: number): void {
        this.followUpsLoading = true;
        this.followUps = [];
        this.caseService.getFollowUps(caseId)
            .pipe(finalize(() => (this.followUpsLoading = false)))
            .subscribe(rows => { this.followUps = rows; });
    }

    addFollowUp(): void {
        if (!this.detailCase || !this.newFollowUpNotes.trim()) {
            this.notify.warning('Escribe una nota para el seguimiento');
            return;
        }
        this.saving = true;
        this.caseService.createFollowUp(this.detailCase.caseTrackingId, { notes: this.newFollowUpNotes.trim() })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Seguimiento agregado');
                    this.newFollowUpNotes = '';
                    this.loadFollowUps(this.detailCase!.caseTrackingId);
                },
                error: (e) => this.notify.error(e?.message || 'Error al agregar seguimiento'),
            });
    }

    updateCase(): void {
        if (!this.detailCase) return;
        this.saving = true;
        this.caseService.update(this.detailCase.caseTrackingId, {
            status: this.editCaseStatus,
            priority: this.editCasePriority || undefined,
        }).pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso actualizado');
                    this.loadCaseForAlert(this.detailAlert!.alertId);
                },
                error: (e) => this.notify.error(e?.message || 'Error al actualizar caso'),
            });
    }

    closeCase(): void {
        if (!this.detailCase) return;
        this.saving = true;
        this.caseService.close(this.detailCase.caseTrackingId, this.closeReason.trim() || undefined)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Caso cerrado');
                    this.loadCaseForAlert(this.detailAlert!.alertId);
                    this.load(); // Refrescar tabla
                },
                error: (e) => this.notify.error(e?.message || 'Error al cerrar caso'),
            });
    }

    resolveAlertFromDetail(): void {
        if (!this.detailAlert) return;
        this.saving = true;
        this.service.resolve(this.detailAlert.alertId, { resolution: this.resolution.trim() || undefined })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta marcada como resuelta');
                    this.resolution = '';
                    // Actualizar alerta en memoria
                    this.detailAlert = { ...this.detailAlert!, status: 'RESOLVED' };
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al resolver alerta'),
            });
    }

    casePriorityBadge(p: string | undefined): string {
        switch ((p ?? '').toUpperCase()) {
            case 'CRITICAL': return 'badge badge--danger';
            case 'HIGH':     return 'badge badge--warning';
            case 'MEDIUM':   return 'badge badge--info';
            case 'LOW':      return 'badge badge--success';
            default:         return 'badge badge--neutral';
        }
    }

    caseStatusBadge(s: string | undefined): string {
        switch ((s ?? '').toUpperCase()) {
            case 'OPEN':        return 'badge badge--warning';
            case 'IN_PROGRESS': return 'badge badge--info';
            case 'ESCALATED':   return 'badge badge--danger';
            case 'CLOSED':      return 'badge badge--neutral';
            default:            return 'badge badge--neutral';
        }
    }

    caseStatusLabel(s: string | undefined): string {
        switch ((s ?? '').toUpperCase()) {
            case 'OPEN':        return 'Abierto';
            case 'IN_PROGRESS': return 'En Proceso';
            case 'ESCALATED':   return 'Escalado';
            case 'CLOSED':      return 'Cerrado';
            default:            return s ?? '-';
        }
    }

    casePriorityLabel(p: string | undefined): string {
        switch ((p ?? '').toUpperCase()) {
            case 'CRITICAL': return 'Crítica';
            case 'HIGH':     return 'Alta';
            case 'MEDIUM':   return 'Media';
            case 'LOW':      return 'Baja';
            default:         return p ?? '-';
        }
    }
    openAcknowledgeModal(alert: AdminAlertDto, event: Event): void {
        event.stopPropagation();
        this.modalAlert = alert;
        this.modalForm = {
            actionTaken: '',
            assignedToUserID: null,
            priority: alert.alertLevel === 'CRITICAL' ? 'CRITICAL' : alert.alertLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
            description: alert.description
                ? `${alert.title ? alert.title + '. ' : ''}${alert.description}`
                : (alert.title ?? ''),
        };
        this.showAcknowledgeModal = true;

        // Cargar psicólogos si aún no están cargados
        if (this.psychologists.length === 0) {
            this.psychologistsLoading = true;
            this.usersService.listUsers().pipe(
                catchError(() => of([])),
                finalize(() => (this.psychologistsLoading = false)),
            ).subscribe(users => {
                this.psychologists = users.filter(u => {
                    const hasRoleId = (u.roleIds ?? []).includes(5);
                    const hasRoleName = (u.roles ?? []).some(r =>
                        r.toLowerCase().replace(/[áéíóúü]/g, (c: string) =>
                            ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c)
                        ).includes('psychologist')
                    );
                    return hasRoleId || hasRoleName;
                });
            });
        }
    }

    closeAcknowledgeModal(): void {
        this.showAcknowledgeModal = false;
        this.modalAlert = null;
    }

    /** Reconoce la alerta y crea el caso de seguimiento en un solo paso */
    confirmAcknowledgeAndCreateCase(): void {
        if (!this.modalAlert) return;

        if (!this.modalForm.assignedToUserID) {
            this.notify.warning('Selecciona un psicólogo para asignar el caso');
            return;
        }
        if (!this.modalForm.description.trim()) {
            this.notify.warning('Escribe una descripción para el caso');
            return;
        }

        this.saving = true;
        const alert = this.modalAlert;

        // 1️⃣ Reconocer la alerta
        this.service.acknowledge(alert.alertId, this.modalForm.actionTaken || undefined)
            .pipe(
                // 2️⃣ Luego crear el caso de seguimiento
                switchMap(() => {
                    const payload: CreateCaseTrackingDto = {
                        alertId: alert.alertId,
                        userId: alert.userId,
                        assignedToUserID: this.modalForm.assignedToUserID!,
                        priority: this.modalForm.priority,
                        description: this.modalForm.description.trim(),
                    };
                    return this.caseService.create(payload).pipe(
                        catchError(err => {
                            console.error('[AcknowledgeModal] createCase error:', err);
                            // Si falla la creación del caso igual mostramos éxito parcial
                            this.notify.warning('Alerta reconocida, pero no se pudo crear el caso: ' + (err?.error?.Message ?? err?.message ?? 'Error desconocido'));
                            return of(null);
                        })
                    );
                }),
                finalize(() => (this.saving = false)),
            )
            .subscribe({
                next: (caseResult) => {
                    if (caseResult) {
                        this.notify.success(`Alerta reconocida y caso ${caseResult.caseNumber ?? ''} creado correctamente`);
                    }
                    this.closeAcknowledgeModal();
                    this.selectedAlert = null;
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al reconocer la alerta'),
            });
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
