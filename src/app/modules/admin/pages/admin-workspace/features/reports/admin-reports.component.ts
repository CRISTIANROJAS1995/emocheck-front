import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminExportService, DataExportDto, ExportRequestDto } from 'app/core/services/admin-export.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-reports.component.html',
    styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit, OnDestroy {
    loading = false;
    saving = false;
    showForm = false;
    exports: DataExportDto[] = [];
    filteredExports: DataExportDto[] = [];
    searchText = '';

    // Polling para exportaciones pendientes
    private pollSub: Subscription | null = null;

    // Tipos y formatos válidos según el API
    readonly exportTypes = [
        { value: 'EVALUATIONS',   label: 'Evaluaciones' },
        { value: 'ALERTS',        label: 'Alertas' },
        { value: 'USERS',         label: 'Usuarios' },
        { value: 'RESULTS',       label: 'Resultados' },
        { value: 'CASE_TRACKING', label: 'Seguimiento de Casos' },
    ];
    readonly exportFormats = [
        { value: 'XLSX', label: 'Excel (XLSX)' },
        { value: 'CSV',  label: 'CSV' },
    ];

    request: ExportRequestDto = {
        exportType: 'EVALUATIONS',
        format: 'XLSX',
    };

    // Filtros extra para el JSON "filters"
    filterStartDate = '';
    filterEndDate = '';
    filterCompanyId = '';

    // Sort
    sortField = 'dataExportId';
    sortAsc = false;

    constructor(
        private readonly service: AdminExportService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void { this.load(); }

    ngOnDestroy(): void { this.pollSub?.unsubscribe(); }

    load(): void {
        this.loading = true;
        this.service.myExports()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => {
                    this.exports = rows;
                    this.applyFilter();
                    this.startPollingIfNeeded();
                },
                error: () => this.notify.error('No fue posible cargar exportaciones'),
            });
    }

    applyFilter(): void {
        let filtered = this.exports;
        const q = this.searchText.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(e =>
                `${e.exportType ?? ''} ${e.format ?? e.fileFormat ?? ''} ${e.status ?? ''}`.toLowerCase().includes(q)
            );
        }
        filtered = [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '');
            const bVal = String((b as any)[this.sortField] ?? '');
            const cmp = aVal.localeCompare(bVal);
            return this.sortAsc ? cmp : -cmp;
        });
        this.filteredExports = filtered;
    }

    toggleSort(field: string): void {
        if (this.sortField === field) { this.sortAsc = !this.sortAsc; } else { this.sortField = field; this.sortAsc = true; }
        this.applyFilter();
    }

    sortClass(field: string): string {
        if (this.sortField !== field) return '';
        return this.sortAsc ? 'sorted-asc' : 'sorted-desc';
    }

    create(): void {
        // Construir el JSON string de filtros
        const filtersObj: Record<string, unknown> = {};
        if (this.filterStartDate) filtersObj['startDate'] = this.filterStartDate;
        if (this.filterEndDate)   filtersObj['endDate']   = this.filterEndDate;
        if (this.filterCompanyId) filtersObj['companyId'] = Number(this.filterCompanyId);

        // El backend siempre espera el campo "filters" como JSON string (nunca null/undefined)
        const payload: ExportRequestDto = {
            exportType: this.request.exportType,
            format: this.request.format,
            filters: JSON.stringify(Object.keys(filtersObj).length ? filtersObj : {}),
        };

        this.saving = true;
        this.service.requestExport(payload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: (created) => {
                    this.notify.success('Exportación solicitada — se procesará en breve');
                    this.showForm = false;
                    this.filterStartDate = '';
                    this.filterEndDate = '';
                    this.filterCompanyId = '';
                    this.request = { exportType: 'EVALUATIONS', format: 'XLSX' };
                    // Añadir al principio de la lista y arrancar polling
                    if (created) {
                        this.exports = [created, ...this.exports];
                        this.applyFilter();
                    }
                    this.load();
                },
                error: (e: HttpErrorResponse) => {
                    console.error('[Export 500] body:', e?.error);
                    const body = e?.error;
                    const msg = body?.message || body?.errors?.join(', ') || e?.message || 'Error al solicitar exportación';
                    this.notify.error(msg);
                },
            });
    }

    /** Refresca el estado de una exportación individual */
    refresh(row: DataExportDto): void {
        const id = row.dataExportId;
        if (!id) return;
        this.service.getExport(id).subscribe({
            next: (updated) => {
                const idx = this.exports.findIndex(e => e.dataExportId === id);
                if (idx >= 0) this.exports[idx] = updated;
                this.applyFilter();
                if ((updated.status ?? '').toUpperCase() === 'COMPLETED') {
                    this.notify.success('¡Exportación lista para descargar!');
                }
            },
            error: () => this.notify.error('No se pudo actualizar el estado'),
        });
    }

    /** Arranca polling automático cada 10s si hay exportaciones PENDING/PROCESSING */
    private startPollingIfNeeded(): void {
        this.pollSub?.unsubscribe();
        const hasPending = this.exports.some(e =>
            ['PENDING', 'PROCESSING'].includes((e.status ?? '').toUpperCase())
        );
        if (!hasPending) return;

        this.pollSub = interval(10_000).pipe(
            switchMap(() => this.service.myExports()),
            takeWhile(rows => rows.some(e => ['PENDING', 'PROCESSING'].includes((e.status ?? '').toUpperCase())), true)
        ).subscribe(rows => {
            this.exports = rows;
            this.applyFilter();
        });
    }

    downloadUrl(row: DataExportDto): string {
        return this.service.getDownloadUrl(row);
    }

    isReady(row: DataExportDto): boolean {
        return (row.status ?? '').toUpperCase() === 'COMPLETED';
    }

    isPending(row: DataExportDto): boolean {
        return ['PENDING', 'PROCESSING'].includes((row.status ?? '').toUpperCase());
    }

    statusBadge(status: string | undefined): string {
        switch ((status ?? '').toUpperCase()) {
            case 'COMPLETED':  return 'badge badge--success';
            case 'PROCESSING': return 'badge badge--info';
            case 'PENDING':    return 'badge badge--warning';
            case 'FAILED':     return 'badge badge--danger';
            default:           return 'badge badge--neutral';
        }
    }

    statusLabel(status: string | undefined): string {
        switch ((status ?? '').toUpperCase()) {
            case 'COMPLETED':  return 'Completada';
            case 'PROCESSING': return 'Procesando';
            case 'PENDING':    return 'Pendiente';
            case 'FAILED':     return 'Error';
            default:           return status ?? 'Desconocido';
        }
    }

    get completedCount(): number { return this.exports.filter(e => (e.status ?? '').toUpperCase() === 'COMPLETED').length; }
    get pendingCount(): number   { return this.exports.filter(e => this.isPending(e)).length; }
}
