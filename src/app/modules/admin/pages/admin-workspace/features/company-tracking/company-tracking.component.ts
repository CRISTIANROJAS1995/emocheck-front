import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DashboardService, DashboardIndicatorsDto, RiskDistributionDto } from 'app/core/services/dashboard.service';
import { AdminUsersService, AdminUserListItemDto } from 'app/core/services/admin-users.service';
import { AdminAlertsService } from 'app/core/services/admin-alerts.service';
import { EvaluationsService } from 'app/core/services/evaluations.service';

type RiskTone = 'green' | 'yellow' | 'red' | 'none';

interface ModuleStatus {
    completed: boolean;
    riskTone: RiskTone;
    riskLabel: string;
    completedAt: string | null;
}

interface EvalHistoryItem {
    moduleName: string;
    riskTone: RiskTone;
    riskLabel: string;
    completedAt: string | null;
}

interface UserTrackingRow {
    userID: number;
    fullName: string;
    email: string;
    areaName: string;
    siteName: string;
    isActive: boolean;
    evaluationsCompleted: number;
    riskTone: RiskTone;
    riskLabel: string;
    lastActivity: string | null;
    lastEvaluationDate: string | null;
    mentalHealth: ModuleStatus;
    workFatigue: ModuleStatus;
    climateOrg: ModuleStatus;
    psychosocial: ModuleStatus;
}

@Component({
    selector: 'app-company-tracking',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './company-tracking.component.html',
    styleUrls: ['./company-tracking.component.scss'],
})
export class CompanyTrackingComponent implements OnInit {
    loading = true;

    // KPI cards
    indicators: DashboardIndicatorsDto | null = null;
    unattendedAlertsCount = 0;

    // User rows
    users: AdminUserListItemDto[] = [];
    companyEvals: any[] = [];
    evalsByUser = new Map<number, any[]>();
    expandedUserId: number | null = null;
    rows: UserTrackingRow[] = [];
    filteredRows: UserTrackingRow[] = [];

    searchText = '';
    riskFilter: 'all' | 'green' | 'yellow' | 'red' = 'all';
    activeFilter: 'all' | 'active' | 'inactive' = 'all';

    sortField: keyof UserTrackingRow = 'fullName';
    sortAsc = true;

    constructor(
        private readonly dashboard: DashboardService,
        private readonly usersService: AdminUsersService,
        private readonly alertsService: AdminAlertsService,
        private readonly evaluationsService: EvaluationsService,
    ) { }

    ngOnInit(): void {
        forkJoin({
            indicators: this.dashboard.getIndicators().pipe(catchError(() => of(null))),
            users: this.usersService.listUsers().pipe(catchError(() => of([]))),
            alerts: this.alertsService.list().pipe(catchError(() => of([]))),
            evals: this.evaluationsService.listMyCompanyEvaluations().pipe(catchError(() => of([]))),
        })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(({ indicators, users, alerts, evals }) => {
            this.indicators = indicators;
            this.unattendedAlertsCount = (alerts as any[]).filter((a: any) => !a.isAttended).length;
            this.users = users as AdminUserListItemDto[];
            this.companyEvals = evals as any[];
            this.indexEvalsByUser();
            this.buildRows();
            this.applyFilters();
        });
    }

    private indexEvalsByUser(): void {
        this.evalsByUser.clear();
        for (const e of this.companyEvals) {
            const uid = Number(e.userID ?? e.userId ?? e.UserID ?? 0);
            if (!uid) continue;
            if (!this.evalsByUser.has(uid)) this.evalsByUser.set(uid, []);
            this.evalsByUser.get(uid)!.push(e);
        }
    }

    private buildRows(): void {
        this.rows = this.users.map(u => {
            const allEvals = this.evalsByUser.get(u.userId ?? 0) ?? [];
            const completed = allEvals.filter(e =>
                (e.status ?? '').toLowerCase().includes('complet') || !!e.isCompleted
            );
            return {
                userID: u.userId ?? 0,
                fullName: u.fullName ?? '—',
                email: u.email ?? '—',
                areaName: u.areaName ?? '—',
                siteName: u.siteName ?? '—',
                isActive: u.isActive ?? false,
                evaluationsCompleted: completed.length || (u.evaluationsCompleted ?? 0),
                riskTone: this.resolveRiskTone(u.lastRiskLevel ?? ''),
                riskLabel: this.resolveRiskLabel(u.lastRiskLevel ?? ''),
                lastActivity: u.lastLoginAt ?? null,
                lastEvaluationDate: u.lastEvaluationDate ?? null,
                mentalHealth: this.buildModuleStatus(completed, 'mentalHealth'),
                workFatigue: this.buildModuleStatus(completed, 'workFatigue'),
                climateOrg: this.buildModuleStatus(completed, 'climateOrg'),
                psychosocial: this.buildModuleStatus(completed, 'psychosocial'),
            };
        });
    }

    private classifyEval(e: any): 'mentalHealth' | 'workFatigue' | 'climateOrg' | 'psychosocial' | null {
        const name = (e.assessmentModuleName ?? e.moduleName ?? '').toLowerCase();
        const id = Number(e.assessmentModuleID ?? e.assessmentModuleId ?? 0);
        if (name.includes('mental') || name.includes('salud') || id === 1) return 'mentalHealth';
        if (name.includes('fatiga') || name.includes('fatigue') || id === 2) return 'workFatigue';
        if (name.includes('clima') || name.includes('climate') || name.includes('organizacional') || id === 3) return 'climateOrg';
        if (name.includes('psicosocial') || name.includes('riesgo') || name.includes('psychosocial') || id === 4) return 'psychosocial';
        return null;
    }

    private buildModuleStatus(completedEvals: any[], module: string): ModuleStatus {
        const match = completedEvals.find(e => this.classifyEval(e) === module);
        if (!match) return { completed: false, riskTone: 'none', riskLabel: '—', completedAt: null };
        const raw = match.riskLevel ?? match.result?.riskLevel ?? '';
        return {
            completed: true,
            riskTone: this.resolveRiskTone(raw),
            riskLabel: this.resolveRiskLabel(raw),
            completedAt: match.completedAt ?? null,
        };
    }

    private resolveRiskTone(raw: string): RiskTone {
        const v = (raw ?? '').toLowerCase();
        if (!v) return 'none';
        if (v.includes('green') || v.includes('low') || v.includes('bajo')) return 'green';
        if (v.includes('yellow') || v.includes('mod') || v.includes('medio')) return 'yellow';
        if (v.includes('red') || v.includes('high') || v.includes('alto') || v.includes('sev')) return 'red';
        return 'none';
    }

    private resolveRiskLabel(raw: string): string {
        const v = (raw ?? '').toLowerCase();
        if (!v) return '—';
        if (v.includes('green') || v.includes('low') || v.includes('bajo')) return 'Bajo';
        if (v.includes('yellow') || v.includes('mod') || v.includes('medio')) return 'Moderado';
        if (v.includes('red') || v.includes('high') || v.includes('alto') || v.includes('sev')) return 'Alto';
        return '—';
    }

    toggleDetail(userId: number): void {
        this.expandedUserId = this.expandedUserId === userId ? null : userId;
    }

    getUserEvalHistory(userId: number): EvalHistoryItem[] {
        const evals = this.evalsByUser.get(userId) ?? [];
        return evals
            .filter(e => (e.status ?? '').toLowerCase().includes('complet') || !!e.isCompleted)
            .map(e => ({
                moduleName: e.assessmentModuleName ?? e.moduleName ?? 'Módulo',
                riskTone: this.resolveRiskTone(e.riskLevel ?? e.result?.riskLevel ?? ''),
                riskLabel: this.resolveRiskLabel(e.riskLevel ?? e.result?.riskLevel ?? ''),
                completedAt: e.completedAt ?? null,
            }))
            .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    }

    applyFilters(): void {
        let result = [...this.rows];

        if (this.searchText.trim()) {
            const q = this.searchText.toLowerCase();
            result = result.filter(r =>
                r.fullName.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.areaName.toLowerCase().includes(q) ||
                r.siteName.toLowerCase().includes(q)
            );
        }

        if (this.riskFilter !== 'all') {
            result = result.filter(r => r.riskTone === this.riskFilter);
        }

        if (this.activeFilter === 'active') {
            result = result.filter(r => r.isActive);
        } else if (this.activeFilter === 'inactive') {
            result = result.filter(r => !r.isActive);
        }

        result.sort((a, b) => {
            const vA = a[this.sortField];
            const vB = b[this.sortField];
            if (typeof vA === 'object' || typeof vB === 'object') return 0;
            const cmp = String(vA ?? '').localeCompare(String(vB ?? ''), undefined, { numeric: true });
            return this.sortAsc ? cmp : -cmp;
        });

        this.filteredRows = result;
    }


    toggleSort(field: keyof UserTrackingRow): void {
        if (this.sortField === field) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortField = field;
            this.sortAsc = true;
        }
        this.applyFilters();
    }

    sortClass(field: keyof UserTrackingRow): string {
        if (this.sortField !== field) return 'sortable';
        return this.sortAsc ? 'sortable sort-asc' : 'sortable sort-desc';
    }

    get totalUsers(): number { return this.indicators?.totalUsers ?? this.users.length; }
    get activeUsers(): number { return this.users.filter(u => u.isActive).length; }
    get participationRate(): number { return Math.round(this.indicators?.participationRate ?? 0); }
    get unattendedAlerts(): number { return this.unattendedAlertsCount; }

    get riskDist(): RiskDistributionDto {
        return this.indicators?.riskDistribution ?? {
            greenCount: 0, yellowCount: 0, redCount: 0,
            greenPercentage: 0, yellowPercentage: 0, redPercentage: 0,
        };
    }
}
