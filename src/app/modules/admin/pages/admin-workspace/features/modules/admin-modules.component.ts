import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import {
    AdminAssessmentModuleDto,
    AdminQuestionDto,
    AdminModulesService,
    ModuleFullDto,
} from 'app/core/services/admin-modules.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

type ViewMode = 'list' | 'detail';

@Component({
    selector: 'app-admin-modules',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-modules.component.html',
    styleUrls: ['./admin-modules.component.scss'],
})
export class AdminModulesComponent implements OnInit {
    loading = false;
    detailLoading = false;
    saving = false;
    search = '';
    viewMode: ViewMode = 'list';

    modules: AdminAssessmentModuleDto[] = [];
    selectedModule: ModuleFullDto | null = null;

    // Sort
    sortField = 'moduleID';
    sortAsc = true;

    // ── Create Module ──
    showCreateModule = false;
    moduleForm: Partial<AdminAssessmentModuleDto> = this.emptyModule();

    // ── Edit Module ──
    editingModuleId: number | null = null;
    editModuleForm: Partial<AdminAssessmentModuleDto> = {};

    constructor(private readonly service: AdminModulesService, private readonly notify: AlertService) { }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listModules()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (rows) => (this.modules = rows),
                error: () => this.notify.error('No fue posible cargar módulos'),
            });
    }

    get filteredModules(): AdminAssessmentModuleDto[] {
        const q = this.search.trim().toLowerCase();
        let filtered = this.modules;
        if (q) {
            filtered = filtered.filter((m) =>
                `${m.name ?? ''} ${m.description ?? ''} ${m.instrumentType ?? ''}`.toLowerCase().includes(q)
            );
        }
        return [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '');
            const bVal = String((b as any)[this.sortField] ?? '');
            const cmp = aVal.localeCompare(bVal);
            return this.sortAsc ? cmp : -cmp;
        });
    }

    toggleSort(field: string): void {
        if (this.sortField === field) { this.sortAsc = !this.sortAsc; } else { this.sortField = field; this.sortAsc = true; }
    }

    sortClass(field: string): string {
        if (this.sortField !== field) return '';
        return this.sortAsc ? 'sorted-asc' : 'sorted-desc';
    }

    openDetail(mod: AdminAssessmentModuleDto): void {
        this.viewMode = 'detail';
        this.detailLoading = true;
        this.editingModuleId = null;
        this.service.getModuleFull(mod.moduleID)
            .pipe(finalize(() => (this.detailLoading = false)))
            .subscribe({
                next: (full) => (this.selectedModule = full),
                error: () => {
                    this.notify.error('No se pudo cargar el módulo completo');
                    this.viewMode = 'list';
                },
            });
    }

    backToList(): void {
        this.viewMode = 'list';
        this.selectedModule = null;
        this.editingModuleId = null;
    }

    get activeCount(): number { return this.modules.filter(m => m.isActive).length; }
    get totalQuestions(): number {
        return this.selectedModule?.questions?.length ?? 0;
    }

    // ═══════════ MODULE CRUD ═══════════

    createModule(): void {
        if (!this.moduleForm.name?.trim()) {
            this.notify.error('El nombre del módulo es requerido');
            return;
        }
        this.saving = true;
        this.service.createModule(this.moduleForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Módulo creado exitosamente');
                    this.moduleForm = this.emptyModule();
                    this.showCreateModule = false;
                    this.load();
                },
                error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al crear módulo'),
            });
    }

    startEditModule(): void {
        const m = this.selectedModule?.module;
        if (!m) return;
        this.editingModuleId = m.moduleID;
        this.editModuleForm = {
            name: m.name,
            description: m.description,
            instrumentType: m.instrumentType,
            maxScore: m.maxScore,
            estimatedMinutes: m.estimatedMinutes,
            orderIndex: m.orderIndex,
            isActive: m.isActive,
        };
    }

    cancelEditModule(): void {
        this.editingModuleId = null;
        this.editModuleForm = {};
    }

    saveEditModule(): void {
        if (!this.editingModuleId) return;
        if (!this.editModuleForm.name?.trim()) {
            this.notify.error('El nombre es requerido');
            return;
        }
        this.saving = true;
        this.service.updateModule(this.editingModuleId, this.editModuleForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Módulo actualizado');
                    this.editingModuleId = null;
                    this.refreshDetail();
                },
                error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al actualizar módulo'),
            });
    }

    async deleteModule(mod: AdminAssessmentModuleDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar el módulo "${mod.name}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteModule(mod.moduleID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Módulo eliminado');
                    if (this.viewMode === 'detail') {
                        this.backToList();
                    }
                    this.load();
                },
                error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al eliminar módulo'),
            });
    }

    // ═══════════ HELPERS ═══════════

    private refreshDetail(): void {
        if (!this.selectedModule?.module?.moduleID) return;
        this.detailLoading = true;
        this.service.getModuleFull(this.selectedModule.module.moduleID)
            .pipe(finalize(() => (this.detailLoading = false)))
            .subscribe({
                next: (full) => { this.selectedModule = full; this.load(); },
                error: () => this.notify.error('Error al recargar módulo'),
            });
    }

    private emptyModule(): Partial<AdminAssessmentModuleDto> {
        return { name: '', description: '', instrumentType: '', maxScore: 100, estimatedMinutes: 10, isActive: true, orderIndex: 0 };
    }
}
