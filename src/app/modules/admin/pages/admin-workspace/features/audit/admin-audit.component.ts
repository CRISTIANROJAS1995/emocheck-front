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
    auditPage = 1;
    auditPageSize = 50;
    auditTotal = 0;

    // System logs
    systemLogs: SystemLogDto[] = [];
    filteredSystemLogs: SystemLogDto[] = [];
    systemSearch = '';

    // Date filters
    startDate = '';
    endDate = '';

    // Sort
    sortField = 'auditLogID';
    sortAsc = false;

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
        let filtered = this.auditLogs;
        if (q) {
            filtered = filtered.filter(l =>
                `${l.tableName ?? ''} ${l.action ?? ''} ${l.userName ?? ''} ${l.userID ?? ''}`
                    .toLowerCase().includes(q)
            );
        }
        this.filteredAuditLogs = filtered;
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
        let filtered = this.systemLogs;
        if (q) {
            filtered = filtered.filter(l =>
                `${l.message ?? ''} ${l.level ?? ''} ${l.source ?? ''}`.toLowerCase().includes(q)
            );
        }
        this.filteredSystemLogs = filtered;
    }

    actionBadge(action: string | undefined): string {
        switch ((action ?? '').toLowerCase()) {
            case 'insert': case 'create': return 'badge badge--success';
            case 'update': case 'modify': return 'badge badge--info';
            case 'delete': return 'badge badge--danger';
            default: return 'badge badge--neutral';
        }
    }

    levelBadge(level: string | undefined): string {
        switch ((level ?? '').toLowerCase()) {
            case 'error': case 'fatal': return 'badge badge--danger';
            case 'warning': case 'warn': return 'badge badge--warning';
            case 'info': case 'information': return 'badge badge--info';
            default: return 'badge badge--neutral';
        }
    }
}
