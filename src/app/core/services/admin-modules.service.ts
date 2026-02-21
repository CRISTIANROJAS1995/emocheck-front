import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ── Frontend-facing DTO (normalized from backend response) ──
export interface AdminAssessmentModuleDto {
    moduleID: number;
    name?: string | null;
    description?: string | null;
    instrumentType?: string | null;
    maxScore?: number;
    orderIndex?: number;
    estimatedMinutes?: number;
    isActive?: boolean;
}

// ── Payload sent TO the backend for create / update ──
export interface CreateModulePayload {
    moduleName: string;
    description?: string;
    instrumentType?: string;
    maxScore: number;
    greenThreshold?: number;
    yellowThreshold?: number;
    orderIndex: number;
    estimatedMinutes: number;
}

export interface AdminQuestionDto {
    questionID: number;
    assessmentModuleID?: number;
    questionText?: string | null;
    orderIndex?: number;
    responseType?: string | null;
    isRequired?: boolean;
    options?: AdminQuestionOptionDto[];
}

export interface AdminQuestionOptionDto {
    questionOptionID: number;
    questionID: number;
    optionText?: string | null;
    optionValue?: number;
    orderIndex?: number;
}

export interface ModuleFullDto {
    module: AdminAssessmentModuleDto;
    questions: AdminQuestionDto[];
}

// ── Backend raw shapes ──
interface BackendModuleDto {
    assessmentModuleID?: number;
    moduleName?: string;
    description?: string;
    instrumentType?: string;
    maxScore?: number;
    greenThreshold?: number;
    yellowThreshold?: number;
    orderIndex?: number;
    estimatedMinutes?: number;
    isActive?: boolean;
}

interface BackendModuleWithQuestionsDto {
    assessmentModuleID?: number;
    moduleName?: string;
    description?: string;
    instrumentType?: string;
    maxScore?: number;
    questions?: BackendQuestionDto[];
}

interface BackendQuestionDto {
    questionID?: number;
    assessmentModuleID?: number;
    questionText?: string;
    orderIndex?: number;
    responseType?: string;
    isRequired?: boolean;
    options?: BackendQuestionOptionDto[];
}

interface BackendQuestionOptionDto {
    questionOptionID?: number;
    questionID?: number;
    optionText?: string;
    optionValue?: number;
    orderIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminModulesService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    // ── Map backend response → frontend DTO ──
    private mapModule(row: BackendModuleDto): AdminAssessmentModuleDto {
        return {
            moduleID: Number(row.assessmentModuleID ?? 0),
            name: row.moduleName ?? null,
            description: row.description ?? null,
            instrumentType: row.instrumentType ?? null,
            maxScore: row.maxScore ?? 0,
            orderIndex: row.orderIndex ?? 0,
            estimatedMinutes: row.estimatedMinutes ?? 10,
            isActive: row.isActive ?? true,
        };
    }

    private mapQuestion(q: BackendQuestionDto): AdminQuestionDto {
        return {
            questionID: Number(q.questionID ?? 0),
            assessmentModuleID: q.assessmentModuleID,
            questionText: q.questionText ?? null,
            orderIndex: q.orderIndex ?? 0,
            responseType: q.responseType ?? null,
            isRequired: q.isRequired ?? false,
            options: (q.options ?? []).map(o => ({
                questionOptionID: Number(o.questionOptionID ?? 0),
                questionID: Number(o.questionID ?? 0),
                optionText: o.optionText ?? null,
                optionValue: o.optionValue ?? 0,
                orderIndex: o.orderIndex ?? 0,
            })),
        };
    }

    // ── Build payload for create/update (frontend → backend field names) ──
    private toBackendPayload(payload: Partial<AdminAssessmentModuleDto>): CreateModulePayload {
        return {
            moduleName: payload.name?.trim() || '',
            description: payload.description ?? undefined,
            instrumentType: payload.instrumentType ?? undefined,
            maxScore: payload.maxScore ?? 100,
            greenThreshold: 0,
            yellowThreshold: 0,
            orderIndex: payload.orderIndex ?? 0,
            estimatedMinutes: payload.estimatedMinutes ?? 10,
        };
    }

    /** List all modules — GET /api/assessmentmodule */
    listModules(): Observable<AdminAssessmentModuleDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/assessmentmodule`)
            .pipe(
                map((res) => this.unwrapArray<BackendModuleDto>(res).map(r => this.mapModule(r))),
                catchError(() => of([]))
            );
    }

    /** List active modules — GET /api/assessmentmodule/active */
    listActive(): Observable<AdminAssessmentModuleDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/assessmentmodule/active`)
            .pipe(
                map((res) => this.unwrapArray<BackendModuleDto>(res).map(r => this.mapModule(r))),
                catchError(() => this.listModules())
            );
    }

    /** Get module by ID — GET /api/assessmentmodule/{id} */
    getModule(moduleId: number): Observable<AdminAssessmentModuleDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/assessmentmodule/${moduleId}`)
            .pipe(map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res))));
    }

    /** Get module with questions — GET /api/assessmentmodule/{id}/with-questions */
    getModuleFull(moduleId: number): Observable<ModuleFullDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/assessmentmodule/${moduleId}/with-questions`)
            .pipe(
                map((res) => {
                    const data = this.unwrapObject<BackendModuleWithQuestionsDto>(res);
                    return {
                        module: this.mapModule(data as BackendModuleDto),
                        questions: (data.questions ?? []).map(q => this.mapQuestion(q)),
                    };
                }),
                catchError(() => {
                    // Fallback: get basic module info without questions
                    return this.getModule(moduleId).pipe(
                        map(mod => ({ module: mod, questions: [] }))
                    );
                })
            );
    }

    /** Create module — POST /api/assessmentmodule */
    createModule(payload: Partial<AdminAssessmentModuleDto>): Observable<AdminAssessmentModuleDto> {
        return this.http
            .post<unknown>(`${this.apiUrl}/assessmentmodule`, this.toBackendPayload(payload))
            .pipe(map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res))));
    }

    /** Update module — PUT /api/assessmentmodule/{id} */
    updateModule(moduleId: number, payload: Partial<AdminAssessmentModuleDto>): Observable<AdminAssessmentModuleDto> {
        return this.http
            .put<unknown>(`${this.apiUrl}/assessmentmodule/${moduleId}`, this.toBackendPayload(payload))
            .pipe(map((res) => this.mapModule(this.unwrapObject<BackendModuleDto>(res))));
    }

    /** Delete (deactivate) module — DELETE /api/assessmentmodule/{id} */
    deleteModule(moduleId: number): Observable<void> {
        return this.http
            .delete<void>(`${this.apiUrl}/assessmentmodule/${moduleId}`);
    }

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
