import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface MyEvaluationDto {
    evaluationId: number;
    assessmentModuleId: number;
    moduleName: string;
    status: 'Completed' | 'InProgress' | 'Abandoned';
    startedAt: string;
    completedAt?: string;
    riskLevel?: 'Green' | 'Yellow' | 'Red';
    totalScore?: number;
    hasResult: boolean;
}

interface SwaggerEvaluationDto {
    evaluationID: number;
    assessmentModuleID: number;
    assessmentModuleName?: string | null;
    startedAt: string;
    completedAt?: string | null;
    status?: string | null;
    isCompleted: boolean;
}

interface SwaggerEvaluationWithResponsesDto {
    evaluationID: number;
    responses?: Array<{
        evaluationResponseID: number;
        evaluationID: number;
        questionID: number;
        questionOptionID?: number | null;
        responseValue?: string | null;
        respondedAt: string;
    }> | null;
}

type RiskLevel = 'Green' | 'Yellow' | 'Red' | 'Low' | 'Medium' | 'High' | string;

export interface CompletedEvaluationWithResultDto {
    evaluationID: number;
    assessmentModuleName?: string | null;
    completedAt: string;
    result: {
        evaluationResultID: number;
        evaluationID: number;
        totalScore: number;
        riskLevel?: RiskLevel | null;
        scorePercentage: number;
        interpretation?: string | null;
        calculatedAt: string;
        dimensionScores?: Array<{
            dimensionScoreID: number;
            dimensionName?: string | null;
            score: number;
            maxScore: number;
            riskLevel?: RiskLevel | null;
        }> | null;
        recommendations?: Array<{
            recommendationID: number;
            title?: string | null;
            recommendationText?: string | null;
            priority?: string | null;
            resourceUrl?: string | null;
            isViewed: boolean;
        }> | null;
    };
}

@Injectable({ providedIn: 'root' })
export class EvaluationsService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    getMyEvaluations(filters?: {
        moduleId?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<MyEvaluationDto[]> {
        // Swagger does not define query params for this endpoint.
        // Fetch all and apply client-side filtering to stay 1:1 with the contract.
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-evaluations`).pipe(
            map((res) => {
                const items = this.unwrapArray<SwaggerEvaluationDto>(res);
                let mapped = (items ?? []).map((e) => ({
                    evaluationId: e.evaluationID,
                    assessmentModuleId: e.assessmentModuleID,
                    moduleName: e.assessmentModuleName ?? '',
                    status: (e.status as any) ?? (e.isCompleted ? 'Completed' : 'InProgress'),
                    startedAt: e.startedAt,
                    completedAt: e.completedAt ?? undefined,
                    hasResult: !!e.isCompleted,
                })) as MyEvaluationDto[];

                if (filters?.moduleId != null) {
                    mapped = mapped.filter((e) => e.assessmentModuleId === filters.moduleId);
                }

                if (filters?.status) {
                    const target = String(filters.status).toLowerCase();
                    mapped = mapped.filter((e) => String(e.status ?? '').toLowerCase() === target);
                }

                if (filters?.startDate) {
                    const start = new Date(filters.startDate).getTime();
                    if (!Number.isNaN(start)) {
                        mapped = mapped.filter((e) => new Date(e.startedAt).getTime() >= start);
                    }
                }

                if (filters?.endDate) {
                    const end = new Date(filters.endDate).getTime();
                    if (!Number.isNaN(end)) {
                        mapped = mapped.filter((e) => new Date(e.startedAt).getTime() <= end);
                    }
                }

                return mapped;
            })
        );
    }

    getMyCompletedEvaluationsWithResult(): Observable<CompletedEvaluationWithResultDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<CompletedEvaluationWithResultDto>(res) ?? []),
            catchError(() => of([] as CompletedEvaluationWithResultDto[]))
        );
    }

    getEvaluationResponsesCount(evaluationId: number): Observable<number> {
        if (!evaluationId || evaluationId <= 0) return of(0);

        // V5 API: GET /api/evaluation/{id}/details → includes responses array
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/${evaluationId}/details`).pipe(
            map((res) => {
                const dto = this.unwrapObject<SwaggerEvaluationWithResponsesDto>(res);
                const count = (dto?.responses ?? []).length;
                return Number.isFinite(count) ? count : 0;
            })
        );
    }

    private unwrapArray<T>(res: unknown): T[] {
        const anyRes = this.normalizeResponse(res) as any;
        if (Array.isArray(anyRes)) return anyRes as T[];
        if (anyRes?.success === true) return (anyRes.data ?? []) as T[];
        return [];
    }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = this.normalizeResponse(res) as any;
        if (anyRes?.success === true) return anyRes.data as T;
        return anyRes as T;
    }

    private normalizeResponse(res: unknown): unknown {
        if (typeof res !== 'string') return res;
        const trimmed = res.trim();
        if (!trimmed) return res;
        try {
            return JSON.parse(trimmed);
        } catch {
            return res;
        }
    }
}
