import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminAuditService, AuditLogDto, SystemLogDto } from 'app/core/services/admin-audit.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

type TabId = 'audit' | 'system';

@Component({
    selector: 'app-admin-audit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-audit.component.html',
    styleUrls: ['./admin-audit.component.scss'],
})
export class AdminAuditComponent implements OnInit {
    loading = false;
    activeTab: TabId = 'audit';

    // Audit logs
    auditLogs: AuditLogDto[] = [];
    filteredAuditLogs: AuditLogDto[] = [];
    auditSearch = '';
    auditActionFilter = '';
    auditPage = 1;
    auditPageSize = 50;
    auditTotal = 0;
    expandedAuditId: number | null = null;

    // KPI counters computed from loaded page
    get auditInserts(): number { return this.auditLogs.filter(l => this.isAction(l.action, ['insert', 'create'])).length; }
    get auditUpdates(): number { return this.auditLogs.filter(l => this.isAction(l.action, ['update', 'modify'])).length; }
    get auditDeletes(): number { return this.auditLogs.filter(l => this.isAction(l.action, ['delete'])).length; }

    // System logs
    systemLogs: SystemLogDto[] = [];
    filteredSystemLogs: SystemLogDto[] = [];
    systemSearch = '';
    systemLevelFilter = '';
    expandedSystemId: number | null = null;

    get systemErrors(): number { return this.systemLogs.filter(l => this.isLevel(l.level, ['error', 'fatal'])).length; }
    get systemWarnings(): number { return this.systemLogs.filter(l => this.isLevel(l.level, ['warning', 'warn'])).length; }

    // Shared date filters
    startDate = '';
    endDate = '';

    constructor(private readonly service: AdminAuditService, private readonly notify: AlertService) { }

    ngOnInit(): void { this.loadAudit(); }

    switchTab(tab: TabId): void {
        this.activeTab = tab;
        if (tab === 'audit') this.loadAudit();
        else this.loadSystem();
    }

    // ── Audit Logs ───────────────────────────
    loadAudit(): void {
        this.loading = true;
        this.expandedAuditId = null;
        this.service.getAuditLogs({
            pageNumber: this.auditPage,
            pageSize: this.auditPageSize,
            startDate: this.startDate || undefined,
            endDate: this.endDate || undefined,
        }).pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (res) => {
                    this.auditLogs = res.items;
                    this.auditTotal = res.totalCount;
                    this.applyAuditFilter();
                },
                error: () => this.notify.error('Error al cargar auditoría'),
            });
    }

    applyAuditFilter(): void {
        const q = this.auditSearch.trim().toLowerCase();
        const action = this.auditActionFilter.toLowerCase();
        let filtered = this.auditLogs;
        if (q) {
            filtered = filtered.filter(l =>
                `${l.tableName ?? ''} ${l.action ?? ''} ${l.userName ?? ''} ${l.userID ?? ''} ${l.recordID ?? ''} ${l.ipAddress ?? ''}`
                    .toLowerCase().includes(q)
            );
        }
        if (action) {
            filtered = filtered.filter(l => (l.action ?? '').toLowerCase() === action);
        }
        this.filteredAuditLogs = filtered;
    }

    toggleAuditRow(id: number): void {
        this.expandedAuditId = this.expandedAuditId === id ? null : id;
    }

    hasDetail(log: AuditLogDto): boolean {
        return !!(log.oldValues || log.newValues || log.ipAddress || log.userAgent);
    }

    formatJson(raw: string | null | undefined): string {
        if (!raw) return '';
        try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
    }

    nextPage(): void {
        if (this.auditPage * this.auditPageSize < this.auditTotal) {
            this.auditPage++;
            this.loadAudit();
        }
    }

    prevPage(): void {
        if (this.auditPage > 1) {
            this.auditPage--;
            this.loadAudit();
        }
    }

    get totalAuditPages(): number {
        return Math.ceil(this.auditTotal / this.auditPageSize) || 1;
    }

    // ── System Logs ──────────────────────────
    loadSystem(): void {
        this.loading = true;
        this.expandedSystemId = null;
        this.service.getSystemErrors()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => {
                    this.systemLogs = rows;
                    this.applySystemFilter();
                },
                error: () => this.notify.error('Error al cargar logs del sistema'),
            });
    }

    applySystemFilter(): void {
        const q = this.systemSearch.trim().toLowerCase();
        const lvl = this.systemLevelFilter.toLowerCase();
        let filtered = this.systemLogs;
        if (q) {
            filtered = filtered.filter(l =>
                `${l.message ?? ''} ${l.level ?? ''} ${l.source ?? ''} ${l.stackTrace ?? ''}`.toLowerCase().includes(q)
            );
        }
        if (lvl) {
            filtered = filtered.filter(l => (l.level ?? '').toLowerCase() === lvl);
        }
        this.filteredSystemLogs = filtered;
    }

    toggleSystemRow(id: number): void {
        this.expandedSystemId = this.expandedSystemId === id ? null : id;
    }

    // ── Helpers ──────────────────────────────
    private isAction(action: string | null | undefined, values: string[]): boolean {
        return values.includes((action ?? '').toLowerCase());
    }

    private isLevel(level: string | null | undefined, values: string[]): boolean {
        return values.includes((level ?? '').toLowerCase());
    }

    actionBadge(action: string | undefined): string {
        switch ((action ?? '').toLowerCase()) {
            case 'insert': case 'create': return 'badge badge--success';
            case 'update': case 'modify': return 'badge badge--info';
            case 'delete': return 'badge badge--danger';
            case 'login': case 'logout': return 'badge badge--purple';
            default: return 'badge badge--neutral';
        }
    }

    levelBadge(level: string | undefined): string {
        switch ((level ?? '').toLowerCase()) {
            case 'error': case 'fatal': return 'badge badge--danger';
            case 'warning': case 'warn': return 'badge badge--warning';
            case 'info': case 'information': return 'badge badge--info';
            case 'debug': case 'trace': return 'badge badge--neutral';
            default: return 'badge badge--neutral';
        }
    }
}
