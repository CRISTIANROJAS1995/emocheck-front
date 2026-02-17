import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdminAssessmentModuleDto, AdminModulesService } from 'app/core/services/admin-modules.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-modules',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule],
    templateUrl: './admin-modules.component.html',
    styleUrls: ['./admin-modules.component.scss'],
})
export class AdminModulesComponent implements OnInit {
    loading = false;
    search = '';
    modules: AdminAssessmentModuleDto[] = [];

    constructor(private readonly service: AdminModulesService, private readonly notify: AlertService) { }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.service
            .listActive()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => (this.modules = rows),
                error: (e) => this.notify.error(e?.message || 'No fue posible cargar módulos'),
            });
    }

    get filteredModules(): AdminAssessmentModuleDto[] {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.modules;
        return this.modules.filter((m) => `${m.moduleName || ''} ${m.description || ''}`.toLowerCase().includes(q));
    }
}
