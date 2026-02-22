import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import {
    AdminAssessmentModuleDto,
    AdminInstrumentDto,
    AdminOptionDto,
    AdminQuestionDto,
    AdminScoreRangeDto,
    AdminModulesService,
    CreateInstrumentPayload,
    CreateModulePayload,
    CreateOptionPayload,
    CreateQuestionPayload,
    CreateScoreRangePayload,
    ModuleFullDto,
} from 'app/core/services/admin-modules.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { finalize } from 'rxjs/operators';

type ViewMode = 'list' | 'detail';
type DetailTab = 'info' | 'instruments';

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
    detailTab: DetailTab = 'instruments';

    modules: AdminAssessmentModuleDto[] = [];
    selectedModule: ModuleFullDto | null = null;

    // Sort
    sortField = 'moduleID';
    sortAsc = true;

    //  Create Module 
    showCreateModule = false;
    moduleForm: CreateModulePayload = this.emptyModule();

    //  Edit Module 
    editingModuleId: number | null = null;
    editModuleForm: Partial<CreateModulePayload> = {};

    //  Instrument accordion + CRUD 
    expandedInstrumentIds = new Set<number>();
    showCreateInstrument = false;
    instrumentForm: Partial<CreateInstrumentPayload> = {};
    editingInstrumentId: number | null = null;
    editInstrumentForm: Partial<CreateInstrumentPayload> = {};

    // Quick-edit maxScore inline on instrument card
    quickEditMaxScoreId: number | null = null;
    quickEditMaxScoreValue: number = 0;

    openQuickEditMaxScore(inst: AdminInstrumentDto, event: Event): void {
        event.stopPropagation();
        this.quickEditMaxScoreId = inst.instrumentID;
        this.quickEditMaxScoreValue = inst.maxScore ?? 0;
    }

    saveQuickMaxScore(inst: AdminInstrumentDto, event: Event): void {
        event.stopPropagation();
        if (this.quickEditMaxScoreValue < 0) { this.notify.error('El puntaje máximo no puede ser negativo'); return; }
        this.saving = true;
        this.service.updateInstrument(inst.instrumentID, { maxScore: this.quickEditMaxScoreValue })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: (updated) => {
                    Object.assign(inst, updated);
                    this.quickEditMaxScoreId = null;
                    this.notify.success('Puntaje máximo actualizado');
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar'),
            });
    }

    cancelQuickMaxScore(event: Event): void {
        event.stopPropagation();
        this.quickEditMaxScoreId = null;
    }

    //  Question CRUD (modal-like inline) 
    showCreateQuestion: number | null = null;   // instrumentID
    questionForm: Partial<CreateQuestionPayload> = {};
    editingQuestion: AdminQuestionDto | null = null;
    editQuestionForm: Partial<CreateQuestionPayload> = {};

    //  Option CRUD 
    showCreateOption: number | null = null;     // questionID
    optionForm: Partial<CreateOptionPayload> = {};
    editingOptionId: number | null = null;
    editOptionForm: { optionText: string; numericValue: number } = { optionText: '', numericValue: 0 };
    expandedQuestionIds = new Set<number>();
    questionOptions: Record<number, AdminOptionDto[]> = {};
    loadingOptions = new Set<number>();

    //  Score Ranges 
    expandedRangeInstrumentId: number | null = null;
    scoreRanges: Record<number, AdminScoreRangeDto[]> = {};
    showCreateRange: number | null = null;      // instrumentID
    rangeForm: Partial<CreateScoreRangePayload> = {};
    editingRange: AdminScoreRangeDto | null = null;
    editRangeForm: Partial<CreateScoreRangePayload> = {};

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
                `${m.name ?? ''} ${m.description ?? ''} ${m.code ?? ''}`.toLowerCase().includes(q)
            );
        }
        return [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '');
            const bVal = String((b as any)[this.sortField] ?? '');
            return this.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
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
        this.expandedInstrumentIds.clear();
        this.questionOptions = {};
        this.scoreRanges = {};
        this.service.getModuleFull(mod.moduleID)
            .pipe(finalize(() => (this.detailLoading = false)))
            .subscribe({
                next: (full) => (this.selectedModule = full),
                error: () => { this.notify.error('No se pudo cargar el módulo completo'); this.viewMode = 'list'; },
            });
    }

    backToList(): void {
        this.viewMode = 'list';
        this.selectedModule = null;
        this.editingModuleId = null;
    }

    get activeCount(): number { return this.modules.filter(m => m.isActive).length; }
    get totalQuestions(): number { return this.selectedModule?.questions?.length ?? 0; }

    //  MODULE CRUD 

    createModule(): void {
        if (!this.moduleForm.name?.trim()) { this.notify.error('El nombre es requerido'); return; }
        if (!this.moduleForm.code?.trim()) { this.notify.error('El código es requerido'); return; }
        this.saving = true;
        this.service.createModule(this.moduleForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Módulo creado'); this.moduleForm = this.emptyModule(); this.showCreateModule = false; this.load(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al crear módulo'),
            });
    }

    startEditModule(): void {
        const m = this.selectedModule?.module;
        if (!m) return;
        this.editingModuleId = m.moduleID;
        this.editModuleForm = { code: m.code ?? '', name: m.name ?? '', description: m.description ?? '', maxScore: m.maxScore ?? 100, minScore: m.minScore ?? 0, iconName: m.iconName ?? '', colorHex: m.colorHex ?? '', estimatedMinutes: m.estimatedMinutes ?? 10, displayOrder: m.displayOrder ?? 0 };
    }

    cancelEditModule(): void { this.editingModuleId = null; this.editModuleForm = {}; }

    saveEditModule(): void {
        if (!this.editingModuleId || !this.editModuleForm.name?.trim()) { this.notify.error('El nombre es requerido'); return; }
        this.saving = true;
        this.service.updateModule(this.editingModuleId, this.editModuleForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Módulo actualizado'); this.editingModuleId = null; this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar módulo'),
            });
    }

    async deleteModule(mod: AdminAssessmentModuleDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar el módulo "${mod.name}"?`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteModule(mod.moduleID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Módulo eliminado'); if (this.viewMode === 'detail') this.backToList(); this.load(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar módulo'),
            });
    }

    //  INSTRUMENT CRUD 

    toggleInstrument(id: number): void {
        if (this.expandedInstrumentIds.has(id)) { this.expandedInstrumentIds.delete(id); }
        else { this.expandedInstrumentIds.add(id); }
    }

    isInstrumentExpanded(id: number): boolean { return this.expandedInstrumentIds.has(id); }

    openCreateInstrument(): void {
        this.showCreateInstrument = true;
        this.instrumentForm = { moduleID: this.selectedModule?.module?.moduleID, scaleMin: 0, scaleMax: 3, weightInModule: 100, displayOrder: 0, minScore: 0, maxScore: 0 };
    }

    createInstrument(): void {
        if (!this.instrumentForm.code?.trim()) { this.notify.error('El código es requerido'); return; }
        if (!this.instrumentForm.name?.trim()) { this.notify.error('El nombre es requerido'); return; }
        this.saving = true;
        this.service.createInstrument(this.instrumentForm as CreateInstrumentPayload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Instrumento creado'); this.showCreateInstrument = false; this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al crear instrumento'),
            });
    }

    startEditInstrument(inst: AdminInstrumentDto): void {
        this.editingInstrumentId = inst.instrumentID;
        this.editInstrumentForm = {
            name: inst.name ?? '',
            description: inst.description ?? '',
            scientificBasis: inst.scientificBasis ?? '',
            scaleMin: inst.scaleMin ?? 0,
            scaleMax: inst.scaleMax ?? 3,
            itemCount: inst.itemCount ?? 0,
            minScore: inst.minScore ?? 0,
            maxScore: inst.maxScore ?? 0,
            weightInModule: inst.weightInModule ?? 100,
            displayOrder: inst.displayOrder ?? 0,
        };
    }

    cancelEditInstrument(): void { this.editingInstrumentId = null; this.editInstrumentForm = {}; }

    saveEditInstrument(): void {
        if (!this.editingInstrumentId || !this.editInstrumentForm.name?.trim()) { this.notify.error('El nombre es requerido'); return; }
        this.saving = true;
        this.service.updateInstrument(this.editingInstrumentId, this.editInstrumentForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: (updated) => {
                    this.notify.success('Instrumento actualizado');
                    this.editingInstrumentId = null;
                    // Sync local object to avoid flicker, then refresh full data
                    const local = this.selectedModule?.instruments.find(i => i.instrumentID === updated.instrumentID);
                    if (local) Object.assign(local, updated);
                    this.refreshDetail();
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar instrumento'),
            });
    }

    async deleteInstrument(inst: AdminInstrumentDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar el instrumento "${inst.name}"?`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteInstrument(inst.instrumentID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Instrumento eliminado'); this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar instrumento'),
            });
    }

    //  QUESTION CRUD 

    questionsForInstrument(instrumentId: number): AdminQuestionDto[] {
        return (this.selectedModule?.questions ?? []).filter(q => q.instrumentID === instrumentId);
    }

    openCreateQuestion(instrumentId: number): void {
        this.showCreateQuestion = instrumentId;
        const existing = this.questionsForInstrument(instrumentId);
        this.questionForm = { instrumentID: instrumentId, questionNumber: existing.length + 1, isReversed: false, isRequired: true };
    }

    createQuestion(): void {
        if (!this.questionForm.questionText?.trim()) { this.notify.error('El texto de la pregunta es requerido'); return; }
        this.saving = true;
        this.service.createQuestion(this.questionForm as CreateQuestionPayload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Pregunta creada'); this.showCreateQuestion = null; this.questionForm = {}; this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al crear pregunta'),
            });
    }

    startEditQuestion(q: AdminQuestionDto): void {
        this.editingQuestion = q;
        this.editQuestionForm = { questionText: q.questionText ?? '', questionNumber: q.questionNumber ?? 1, isReversed: q.isReversed ?? false, dimensionCode: q.dimensionCode ?? '', isRequired: q.isRequired ?? true, helpText: q.helpText ?? '' };
    }

    cancelEditQuestion(): void { this.editingQuestion = null; this.editQuestionForm = {}; }

    saveEditQuestion(): void {
        if (!this.editingQuestion || !this.editQuestionForm.questionText?.trim()) { this.notify.error('El texto es requerido'); return; }
        this.saving = true;
        this.service.updateQuestion(this.editingQuestion.questionID, this.editQuestionForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Pregunta actualizada'); this.editingQuestion = null; this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar pregunta'),
            });
    }

    async deleteQuestion(q: AdminQuestionDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar la pregunta "${(q.questionText ?? '').substring(0, 50)}..."?`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteQuestion(q.questionID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => { this.notify.success('Pregunta eliminada'); this.refreshDetail(); },
                error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar pregunta'),
            });
    }

    //  OPTIONS CRUD 

    toggleQuestionOptions(q: AdminQuestionDto): void {
        if (this.expandedQuestionIds.has(q.questionID)) {
            this.expandedQuestionIds.delete(q.questionID);
        } else {
            this.expandedQuestionIds.add(q.questionID);
            this.loadOptions(q.questionID);
        }
    }

    isQuestionExpanded(id: number): boolean { return this.expandedQuestionIds.has(id); }

    loadOptions(questionId: number): void {
        if (this.questionOptions[questionId]) return;
        this.loadingOptions.add(questionId);
        this.service.getOptionsByQuestion(questionId)
            .pipe(finalize(() => this.loadingOptions.delete(questionId)))
            .subscribe({ next: (opts) => { this.questionOptions[questionId] = opts; } });
    }

    openCreateOption(questionId: number): void {
        this.showCreateOption = questionId;
        const existing = this.questionOptions[questionId] ?? [];
        this.optionForm = { questionID: questionId, numericValue: existing.length, displayOrder: existing.length + 1 };
    }

    createOption(): void {
        if (!this.optionForm.optionText?.trim()) { this.notify.error('El texto de la opción es requerido'); return; }
        this.saving = true;
        this.service.createOption(this.optionForm as CreateOptionPayload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Opción creada');
                    this.showCreateOption = null;
                    if (this.optionForm.questionID) {
                        delete this.questionOptions[this.optionForm.questionID];
                        this.loadOptions(this.optionForm.questionID);
                    }
                    this.optionForm = {};
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al crear opción'),
            });
    }

    async deleteOption(opt: AdminOptionDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar la opción "${opt.optionText}"?`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteOption(opt.optionID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Opción eliminada');
                    if (opt.questionID) { delete this.questionOptions[opt.questionID]; this.loadOptions(opt.questionID); }
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar opción'),
            });
    }

    startEditOption(opt: AdminOptionDto): void {
        this.editingOptionId = opt.optionID;
        this.editOptionForm = { optionText: opt.optionText ?? '', numericValue: opt.numericValue ?? 0 };
    }

    cancelEditOption(): void {
        this.editingOptionId = null;
    }

    saveEditOption(opt: AdminOptionDto): void {
        if (!this.editOptionForm.optionText?.trim()) { this.notify.error('El texto de la opción es requerido'); return; }
        this.saving = true;
        this.service.updateOption(opt.optionID, { optionText: this.editOptionForm.optionText, numericValue: this.editOptionForm.numericValue })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: (updated) => {
                    this.notify.success('Opción actualizada');
                    this.editingOptionId = null;
                    if (opt.questionID && this.questionOptions[opt.questionID]) {
                        const idx = this.questionOptions[opt.questionID].findIndex(o => o.optionID === opt.optionID);
                        if (idx !== -1) this.questionOptions[opt.questionID][idx] = updated;
                    }
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar opción'),
            });
    }

    //  SCORE RANGES CRUD 

    toggleScoreRanges(instrumentId: number): void {
        if (this.expandedRangeInstrumentId === instrumentId) {
            this.expandedRangeInstrumentId = null;
        } else {
            this.expandedRangeInstrumentId = instrumentId;
            this.loadScoreRanges(instrumentId);
        }
    }

    loadScoreRanges(instrumentId: number): void {
        if (this.scoreRanges[instrumentId]) return;
        this.service.getScoreRanges(instrumentId)
            .subscribe({ next: (r) => { this.scoreRanges[instrumentId] = r; } });
    }

    openCreateRange(instrumentId: number): void {
        this.showCreateRange = instrumentId;
        this.rangeForm = { instrumentID: instrumentId, minScore: 0, maxScore: 0, colorHex: '#4CAF50', displayOrder: 0 };
    }

    createScoreRange(): void {
        if (!this.rangeForm.label?.trim()) { this.notify.error('La etiqueta es requerida'); return; }
        if (!this.rangeForm.rangeLevel?.trim()) { this.notify.error('El nivel es requerido'); return; }
        this.saving = true;
        this.service.createScoreRange(this.rangeForm as CreateScoreRangePayload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Rango creado');
                    this.showCreateRange = null;
                    if (this.rangeForm.instrumentID) { delete this.scoreRanges[this.rangeForm.instrumentID]; this.loadScoreRanges(this.rangeForm.instrumentID); }
                    this.rangeForm = {};
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al crear rango'),
            });
    }

    startEditRange(r: AdminScoreRangeDto): void {
        this.editingRange = r;
        this.editRangeForm = { rangeLevel: r.rangeLevel ?? '', label: r.label ?? '', colorHex: r.colorHex ?? '#4CAF50', minScore: r.minScore ?? 0, maxScore: r.maxScore ?? 0, description: r.description ?? '', displayOrder: r.displayOrder ?? 0 };
    }

    cancelEditRange(): void { this.editingRange = null; this.editRangeForm = {}; }

    saveEditRange(): void {
        if (!this.editingRange || !this.editRangeForm.label?.trim()) { this.notify.error('La etiqueta es requerida'); return; }
        this.saving = true;
        this.service.updateScoreRange(this.editingRange.scoreRangeID, this.editRangeForm)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Rango actualizado');
                    const instId = this.editingRange!.instrumentID!;
                    this.editingRange = null;
                    delete this.scoreRanges[instId];
                    this.loadScoreRanges(instId);
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar rango'),
            });
    }

    async deleteRange(r: AdminScoreRangeDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar el rango "${r.label}"?`);
        if (!ok) return;
        this.saving = true;
        this.service.deleteScoreRange(r.scoreRangeID)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.notify.success('Rango eliminado');
                    if (r.instrumentID) { delete this.scoreRanges[r.instrumentID]; this.loadScoreRanges(r.instrumentID); }
                },
                error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar rango'),
            });
    }

    //  HELPERS 

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

    private emptyModule(): CreateModulePayload {
        return { code: '', name: '', description: '', maxScore: 100, minScore: 0, estimatedMinutes: 10, displayOrder: 0 };
    }
}
