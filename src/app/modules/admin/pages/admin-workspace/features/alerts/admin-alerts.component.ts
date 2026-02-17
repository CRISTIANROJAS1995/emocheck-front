import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AdminAlertDto, AdminAlertsService } from 'app/core/services/admin-alerts.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-alerts',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule],
    templateUrl: './admin-alerts.component.html',
    styleUrls: ['./admin-alerts.component.scss'],
})
export class AdminAlertsComponent implements OnInit {
    loading = false;
    saving = false;
    status = '';
    level = '';
    startDate = '';
    endDate = '';

    alerts: AdminAlertDto[] = [];
    selectedAlertId: number | null = null;
    actionTaken = '';
    notes = '';

    constructor(private readonly service: AdminAlertsService, private readonly notify: AlertService) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.service
            .list({
                status: this.status || undefined,
                alertLevel: this.level || undefined,
                startDate: this.startDate || undefined,
                endDate: this.endDate || undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => (this.alerts = rows),
                error: (e) => this.notify.error(e?.message || 'No fue posible cargar alertas'),
            });
    }

    selectAlert(row: AdminAlertDto): void {
        this.selectedAlertId = row.alertId;
        this.actionTaken = row.actionTaken || '';
        this.notes = row.notes || '';
    }

    clearSelection(): void {
        this.selectedAlertId = null;
        this.actionTaken = '';
        this.notes = '';
    }

    attendSelected(): void {
        const row = this.selectedAlert;
        if (!row) {
            this.notify.warning('Selecciona una alerta para atender');
            return;
        }
        if (!this.actionTaken.trim()) {
            this.notify.warning('La acción tomada es obligatoria');
            return;
        }

        this.saving = true;
        this.service
            .attend(row.alertId, { actionTaken: this.actionTaken.trim(), notes: this.notes.trim() || undefined })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Alerta atendida');
                    this.clearSelection();
                    this.load();
                },
                error: (e) => this.notify.error(e?.message || 'No fue posible atender la alerta'),
            });
    }

    get selectedAlert(): AdminAlertDto | null {
        if (this.selectedAlertId === null) return null;
        return this.alerts.find((x) => x.alertId === this.selectedAlertId) || null;
    }
}
