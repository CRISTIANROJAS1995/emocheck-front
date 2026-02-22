import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// 
// DTOs Frontend
// 

export interface AdminAssessmentModuleDto {
    moduleID: number;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    minScore?: number;
    maxScore?: number;
    iconName?: string | null;
    colorHex?: string | null;
    displayOrder?: number;
    estimatedMinutes?: number;
    isActive?: boolean;
}

export interface AdminInstrumentDto {
    instrumentID: number;
    moduleID?: number;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    scientificBasis?: string | null;
    scaleMin?: number;
    scaleMax?: number;
    itemCount?: number;
    maxScore?: number;
    minScore?: number;
    weightInModule?: number;
    displayOrder?: number;
    isActive?: boolean;
}

export interface AdminQuestionDto {
    questionID: number;
    instrumentID?: number;
    questionText?: string | null;
    questionNumber?: number;
    isReversed?: boolean;
    dimensionCode?: string | null;
    isRequired?: boolean;
    helpText?: string | null;
    isActive?: boolean;
    options?: AdminOptionDto[];
}

export interface AdminOptionDto {
    optionID: number;
    questionID?: number;
    optionText?: string | null;
    numericValue?: number;
    displayOrder?: number;
}

export interface AdminScoreRangeDto {
    scoreRangeID: number;
    instrumentID?: number;
    rangeLevel?: string | null;
    label?: string | null;
    colorHex?: string | null;
    minScore?: number;
    maxScore?: number;
    description?: string | null;
    displayOrder?: number;
}

export interface ModuleFullDto {
    module: AdminAssessmentModuleDto;
    instruments: AdminInstrumentDto[];
    questions: AdminQuestionDto[];
}

export interface CreateModulePayload {
    code: string;
    name: string;
    description?: string;
    minScore?: number;
    maxScore?: number;
    iconName?: string;
    colorHex?: string;
    displayOrder?: number;
    estimatedMinutes?: number;
}

export interface CreateInstrumentPayload {
    moduleID: number;
    code: string;
    name: string;
    description?: string;
    scientificBasis?: string;
    scaleMin?: number;
    scaleMax?: number;
    itemCount?: number;
    maxScore?: number;
    minScore?: number;
    weightInModule?: number;
    displayOrder?: number;
}

export interface CreateQuestionPayload {
    instrumentID: number;
    questionText: string;
    questionNumber: number;
    originalItemNumber?: number;
    isReversed?: boolean;
    dimensionCode?: string;
    isRequired?: boolean;
    helpText?: string;
}

export interface CreateOptionPayload {
    questionID: number;
    optionText: string;
    numericValue: number;
    displayOrder?: number;
}

export interface CreateScoreRangePayload {
    instrumentID: number;
    rangeLevel: string;
    label: string;
    colorHex: string;
    minScore: number;
    maxScore: number;
    description?: string;
    displayOrder?: number;
}

// 
// Backend raw shapes
// 

interface BackendModuleDto {
    assessmentModuleID?: number;
    moduleID?: number;
    code?: string;
    name?: string;
    moduleName?: string;
    description?: string;
    minScore?: number;
    maxScore?: number;
    iconName?: string;
    colorHex?: string;
    displayOrder?: number;
    orderIndex?: number;
    estimatedMinutes?: number;
    isActive?: boolean;
    instruments?: BackendInstrumentDto[];
}

interface BackendInstrumentDto {
    instrumentID?: number;
    assessmentModuleID?: number;
    moduleID?: number;
    code?: string;
    name?: string;
    description?: string;
    scientificBasis?: string;
    scaleMin?: number;
    scaleMax?: number;
    itemCount?: number;
    maxScore?: number;
    minScore?: number;
    weightInModule?: number;
    displayOrder?: number;
    isActive?: boolean;
    questions?: BackendQuestionDto[];
}

interface BackendQuestionDto {
    questionID?: number;
    instrumentID?: number;
    questionText?: string;
    questionNumber?: number;
    orderIndex?: number;
    isReversed?: boolean;
    dimensionCode?: string;
    isRequired?: boolean;
    helpText?: string;
    isActive?: boolean;
    options?: BackendOptionDto[];
}

interface BackendOptionDto {
    optionID?: number;
    questionOptionID?: number;
    questionID?: number;
    optionText?: string;
    numericValue?: number;
    optionValue?: number;
    displayOrder?: number;
    orderIndex?: number;
}

interface BackendScoreRangeDto {
    scoreRangeID?: number;
    instrumentID?: number;
    rangeLevel?: string;
    label?: string;
    colorHex?: string;
    minScore?: number;
    maxScore?: number;
    description?: string;
    displayOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminModulesService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    // 
    // Mappers
    // 

    private mapModule(row: BackendModuleDto): AdminAssessmentModuleDto {
        return {
            moduleID: Number(row.assessmentModuleID ?? row.moduleID ?? 0),
            code: row.code ?? null,
            name: row.name ?? row.moduleName ?? null,
            description: row.description ?? null,
            minScore: row.minScore ?? 0,
            maxScore: row.maxScore ?? 100,
            iconName: row.iconName ?? null,
            colorHex: row.colorHex ?? null,
            displayOrder: row.displayOrder ?? row.orderIndex ?? 0,
            estimatedMinutes: row.estimatedMinutes ?? 10,
            isActive: row.isActive ?? true,
        };
    }

    private mapInstrument(row: BackendInstrumentDto): AdminInstrumentDto {
        return {
            instrumentID: Number(row.instrumentID ?? 0),
            moduleID: row.assessmentModuleID ?? row.moduleID,
            code: row.code ?? null,
            name: row.name ?? null,
            description: row.description ?? null,
            scientificBasis: row.scientificBasis ?? null,
            scaleMin: row.scaleMin ?? 0,
            scaleMax: row.scaleMax ?? 3,
            itemCount: row.itemCount ?? 0,
            maxScore: row.maxScore ?? 0,
            minScore: row.minScore ?? 0,
            weightInModule: row.weightInModule ?? 100,
            displayOrder: row.displayOrder ?? 0,
            isActive: row.isActive ?? true,
        };
    }

    private mapQuestion(q: BackendQuestionDto): AdminQuestionDto {
        return {
            questionID: Number(q.questionID ?? 0),
            instrumentID: q.instrumentID,
            questionText: q.questionText ?? null,
            questionNumber: q.questionNumber ?? q.orderIndex ?? 0,
            isReversed: q.isReversed ?? false,
            dimensionCode: q.dimensionCode ?? null,
            isRequired: q.isRequired ?? false,
            helpText: q.helpText ?? null,
            isActive: q.isActive ?? true,
            options: (q.options ?? []).map(o => this.mapOption(o)),
        };
    }

    private mapOption(o: BackendOptionDto): AdminOptionDto {
        return {
            optionID: Number(o.optionID ?? o.questionOptionID ?? 0),
            questionID: o.questionID,
            optionText: o.optionText ?? null,
            numericValue: o.numericValue ?? o.optionValue ?? 0,
            displayOrder: o.displayOrder ?? o.orderIndex ?? 0,
        };
    }

    private mapScoreRange(r: BackendScoreRangeDto): AdminScoreRangeDto {
        return {
            scoreRangeID: Number(r.scoreRangeID ?? 0),
            instrumentID: r.instrumentID,
            rangeLevel: r.rangeLevel ?? null,
            label: r.label ?? null,
            colorHex: r.colorHex ?? null,
            minScore: r.minScore ?? 0,
            maxScore: r.maxScore ?? 0,
            description: r.description ?? null,
            displayOrder: r.displayOrder ?? 0,
        };
    }

    // 
    // Modules CRUD
    // 

    listModules(): Observable<AdminAssessmentModuleDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules`).pipe(
            map((res) => this.unwrapArray<BackendModuleDto>(res).map(r => this.mapModule(r))),
            catchError(() => of([]))
        );
    }

    listActive(): Observable<AdminAssessmentModuleDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/active`).pipe(
            map((res) => this.unwrapArray<BackendModuleDto>(res).map(r => this.mapModule(r))),
            catchError(() => this.listModules())
        );
    }

    getModule(moduleId: number): Observable<AdminAssessmentModuleDto> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/${moduleId}`).pipe(
            map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res)))
        );
    }

    getModuleWithInstruments(moduleId: number): Observable<{ module: AdminAssessmentModuleDto; instruments: AdminInstrumentDto[] }> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/${moduleId}/instruments`).pipe(
            map((res) => {
                const data = this.unwrapObject<BackendModuleDto>(res);
                return {
                    module: this.mapModule(data),
                    instruments: (data.instruments ?? []).map(i => this.mapInstrument(i)),
                };
            }),
            catchError(() => this.getModule(moduleId).pipe(map(m => ({ module: m, instruments: [] }))))
        );
    }

    getModuleFull(moduleId: number): Observable<ModuleFullDto> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/${moduleId}/full`).pipe(
            map((res) => {
                const data = this.unwrapObject<BackendModuleDto>(res);
                const instruments = (data.instruments ?? []).map(i => this.mapInstrument(i));
                const questions = (data.instruments ?? []).flatMap(i =>
                    (i.questions ?? []).map(q => this.mapQuestion(q))
                );
                return { module: this.mapModule(data), instruments, questions };
            }),
            catchError(() => this.getModule(moduleId).pipe(map(m => ({ module: m, instruments: [], questions: [] }))))
        );
    }

    createModule(payload: CreateModulePayload): Observable<AdminAssessmentModuleDto> {
        return this.http.post<unknown>(`${this.apiUrl}/assessmentmodule/modules`, payload).pipe(
            map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res)))
        );
    }

    updateModule(moduleId: number, payload: Partial<CreateModulePayload>): Observable<AdminAssessmentModuleDto> {
        return this.http.put<unknown>(`${this.apiUrl}/assessmentmodule/modules/${moduleId}`, payload).pipe(
            map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res)))
        );
    }

    deleteModule(moduleId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assessmentmodule/modules/${moduleId}`);
    }

    // 
    // Instruments CRUD
    // 

    getInstrumentsByModule(moduleId: number): Observable<AdminInstrumentDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/instruments/by-module/${moduleId}`).pipe(
            map((res) => this.unwrapArray<BackendInstrumentDto>(res).map(i => this.mapInstrument(i))),
            catchError(() => of([]))
        );
    }

    getInstrument(instrumentId: number): Observable<AdminInstrumentDto> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/instruments/${instrumentId}`).pipe(
            map((res) => this.mapInstrument(this.unwrapObject<BackendInstrumentDto>(res)))
        );
    }

    getInstrumentWithQuestions(instrumentId: number): Observable<{ instrument: AdminInstrumentDto; questions: AdminQuestionDto[] }> {
        return this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/instruments/${instrumentId}/questions`).pipe(
            map((res) => {
                const data = this.unwrapObject<BackendInstrumentDto>(res);
                return {
                    instrument: this.mapInstrument(data),
                    questions: (data.questions ?? []).map(q => this.mapQuestion(q)),
                };
            }),
            catchError(() => this.getInstrument(instrumentId).pipe(map(i => ({ instrument: i, questions: [] }))))
        );
    }

    createInstrument(payload: CreateInstrumentPayload): Observable<AdminInstrumentDto> {
        return this.http.post<unknown>(`${this.apiUrl}/assessmentmodule/instruments`, payload).pipe(
            map((res) => this.mapInstrument(this.unwrapObject<BackendInstrumentDto>(res)))
        );
    }

    updateInstrument(instrumentId: number, payload: Partial<CreateInstrumentPayload>): Observable<AdminInstrumentDto> {
        return this.http.put<unknown>(`${this.apiUrl}/assessmentmodule/instruments/${instrumentId}`, payload).pipe(
            map((res) => this.mapInstrument(this.unwrapObject<BackendInstrumentDto>(res)))
        );
    }

    deleteInstrument(instrumentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assessmentmodule/instruments/${instrumentId}`);
    }

    // 
    // Questions CRUD  (/api/assessment)
    // 

    getQuestionsByInstrument(instrumentId: number): Observable<AdminQuestionDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessment/questions/by-instrument/${instrumentId}`).pipe(
            map((res) => this.unwrapArray<BackendQuestionDto>(res).map(q => this.mapQuestion(q))),
            catchError(() => of([]))
        );
    }

    getQuestionWithOptions(questionId: number): Observable<AdminQuestionDto> {
        return this.http.get<unknown>(`${this.apiUrl}/assessment/questions/${questionId}/options`).pipe(
            map((res) => this.mapQuestion(this.unwrapObject<BackendQuestionDto>(res)))
        );
    }

    createQuestion(payload: CreateQuestionPayload): Observable<AdminQuestionDto> {
        return this.http.post<unknown>(`${this.apiUrl}/assessment/questions`, payload).pipe(
            map((res) => this.mapQuestion(this.unwrapObject<BackendQuestionDto>(res)))
        );
    }

    updateQuestion(questionId: number, payload: Partial<CreateQuestionPayload>): Observable<AdminQuestionDto> {
        return this.http.put<unknown>(`${this.apiUrl}/assessment/questions/${questionId}`, payload).pipe(
            map((res) => this.mapQuestion(this.unwrapObject<BackendQuestionDto>(res)))
        );
    }

    deleteQuestion(questionId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assessment/questions/${questionId}`);
    }

    // 
    // Options CRUD  (/api/assessment)
    // 

    getOptionsByQuestion(questionId: number): Observable<AdminOptionDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessment/options/by-question/${questionId}`).pipe(
            map((res) => this.unwrapArray<BackendOptionDto>(res).map(o => this.mapOption(o))),
            catchError(() => of([]))
        );
    }

    createOption(payload: CreateOptionPayload): Observable<AdminOptionDto> {
        return this.http.post<unknown>(`${this.apiUrl}/assessment/options`, payload).pipe(
            map((res) => this.mapOption(this.unwrapObject<BackendOptionDto>(res)))
        );
    }

    updateOption(optionId: number, payload: Partial<CreateOptionPayload>): Observable<AdminOptionDto> {
        return this.http.put<unknown>(`${this.apiUrl}/assessment/options/${optionId}`, payload).pipe(
            map((res) => this.mapOption(this.unwrapObject<BackendOptionDto>(res)))
        );
    }

    deleteOption(optionId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assessment/options/${optionId}`);
    }

    // 
    // Score Ranges CRUD  (/api/assessment)
    // 

    getScoreRanges(instrumentId: number): Observable<AdminScoreRangeDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/assessment/score-ranges/by-instrument/${instrumentId}`).pipe(
            map((res) => this.unwrapArray<BackendScoreRangeDto>(res).map(r => this.mapScoreRange(r))),
            catchError(() => of([]))
        );
    }

    createScoreRange(payload: CreateScoreRangePayload): Observable<AdminScoreRangeDto> {
        return this.http.post<unknown>(`${this.apiUrl}/assessment/score-ranges`, payload).pipe(
            map((res) => this.mapScoreRange(this.unwrapObject<BackendScoreRangeDto>(res)))
        );
    }

    updateScoreRange(rangeId: number, payload: Partial<CreateScoreRangePayload>): Observable<AdminScoreRangeDto> {
        return this.http.put<unknown>(`${this.apiUrl}/assessment/score-ranges/${rangeId}`, payload).pipe(
            map((res) => this.mapScoreRange(this.unwrapObject<BackendScoreRangeDto>(res)))
        );
    }

    deleteScoreRange(rangeId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assessment/score-ranges/${rangeId}`);
    }

    // 
    // Helpers
    // 

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as ApiResponse<T>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as ApiResponse<T[]>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return Array.isArray(anyRes.data) ? anyRes.data : [];
        }
        return [];
    }
}
