import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdminExportService, DataExportDto, ExportRequestDto } from 'app/core/services/admin-export.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule],
    templateUrl: './admin-reports.component.html',
    styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
    loading = false;
    saving = false;
    exports: DataExportDto[] = [];

    request: ExportRequestDto = {
        exportType: 'Full',
        fileFormat: 'CSV',
        reason: '',
    };

    constructor(private readonly service: AdminExportService, private readonly notify: AlertService) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.service
            .myExports()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => (this.exports = rows),
                error: (e) => this.notify.error(e?.message || 'No fue posible cargar exportes'),
            });
    }

    create(): void {
        if (!this.request.reason || !this.request.reason.trim()) {
            this.notify.warning('Debes ingresar un motivo para la exportación');
            return;
        }

        const payload: ExportRequestDto = {
            exportType: this.request.exportType,
            fileFormat: this.request.fileFormat,
            reason: this.request.reason.trim(),
            startDate: this.request.startDate ? this.request.startDate.trim() : undefined,
            endDate: this.request.endDate ? this.request.endDate.trim() : undefined,
        };

        this.saving = true;
        this.service
            .requestExport(payload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Exportación solicitada');
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'No fue posible solicitar la exportación'),
            });
    }

    downloadUrl(row: DataExportDto): string {
        return this.service.getDownloadUrl(row);
    }
}
