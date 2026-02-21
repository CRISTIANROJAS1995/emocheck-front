import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminExportService, DataExportDto, ExportRequestDto } from 'app/core/services/admin-export.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-reports.component.html',
    styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
    loading = false;
    saving = false;
    showForm = false;
    exports: DataExportDto[] = [];
    filteredExports: DataExportDto[] = [];
    searchText = '';

    request: ExportRequestDto = {
        exportType: 'Full',
        fileFormat: 'CSV',
        reason: '',
    };

    // Sort
    sortField = 'dataExportId';
    sortAsc = false;

    constructor(private readonly service: AdminExportService, private readonly notify: AlertService) { }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.myExports()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => { this.exports = rows; this.applyFilter(); },
                error: () => this.notify.error('No fue posible cargar exportes'),
            });
    }

    applyFilter(): void {
        let filtered = this.exports;
        const q = this.searchText.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(e =>
                `${e.exportType ?? ''} ${e.fileFormat ?? ''} ${e.status ?? ''}`.toLowerCase().includes(q)
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
        if (!this.request.reason?.trim()) {
            this.notify.warning('Debes ingresar un motivo para la exportación');
            return;
        }
        const payload: ExportRequestDto = {
            exportType: this.request.exportType,
            fileFormat: this.request.fileFormat,
            reason: this.request.reason.trim(),
            startDate: this.request.startDate?.trim() || undefined,
            endDate: this.request.endDate?.trim() || undefined,
        };
        this.saving = true;
        this.service.requestExport(payload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Exportación solicitada');
                    this.showForm = false;
                    this.request = { exportType: 'Full', fileFormat: 'CSV', reason: '' };
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'Error al solicitar exportación'),
            });
    }

    downloadUrl(row: DataExportDto): string {
        return this.service.getDownloadUrl(row);
    }

    statusBadge(status: string | undefined): string {
        switch ((status ?? '').toLowerCase()) {
            case 'completed': return 'badge badge--success';
            case 'processing': case 'pending': return 'badge badge--warning';
            case 'failed': return 'badge badge--danger';
            default: return 'badge badge--neutral';
        }
    }

    get completedCount(): number { return this.exports.filter(e => (e.status ?? '').toLowerCase() === 'completed').length; }
    get pendingCount(): number { return this.exports.filter(e => (e.status ?? '').toLowerCase() !== 'completed').length; }
}
