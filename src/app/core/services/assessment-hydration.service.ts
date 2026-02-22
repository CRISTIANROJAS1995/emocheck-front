import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AssessmentModuleId,
    AssessmentOutcome,
    AssessmentResult,
} from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { environment } from '../../../environments/environment';
import {
    Observable,
    catchError,
    map,
    of,
    tap,
} from 'rxjs';

type RiskLevel = 'Green' | 'Yellow' | 'Red' | 'Low' | 'Medium' | 'High' | string;

interface SwaggerDimensionScoreDto {
    dimensionScoreID: number;
    dimensionName?: string | null;
    score: number;
    maxScore: number;
    riskLevel?: RiskLevel | null;
}

interface SwaggerRecommendationDto {
    recommendationID: number;
    title?: string | null;
    recommendationText?: string | null;
    isViewed: boolean;
}

interface SwaggerEvaluationResultDto {
    evaluationResultID: number;
    evaluationID: number;
    totalScore: number;
    riskLevel?: RiskLevel | string | null;
    scorePercentage: number;
    interpretation?: string | null;
    calculatedAt: string;
    dimensionScores?: SwaggerDimensionScoreDto[] | null;
    recommendations?: SwaggerRecommendationDto[] | null;
}

interface SwaggerEvaluationWithResultDto {
    evaluationID: number;
    assessmentModuleName?: string | null;
    completedAt: string;
    result: SwaggerEvaluationResultDto;
}

@Injectable({ providedIn: 'root' })
export class AssessmentHydrationService {
    private readonly apiUrl = environment.apiUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly state: AssessmentStateService
    ) { }

    /**
     * Hydrates a single module result from `/evaluation/my-completed`.
     * Useful for deep-links (e.g. opening results from history) where there is no in-memory state.
     */
    hydrateModuleResultFromCompletedEvaluations(moduleId: AssessmentModuleId, evaluationId?: number): Observable<void> {
        const targetEvaluationId = Number(evaluationId ?? 0);

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) => {
                const all = items ?? [];

                if (Number.isFinite(targetEvaluationId) && targetEvaluationId > 0) {
                    return (
                        all.find((i: any) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) === targetEvaluationId) ??
                        null
                    );
                }

                const candidates = all
                    .filter((i) => this.mapModuleNameToAssessmentModuleId(i?.assessmentModuleName ?? undefined) === moduleId)
                    .slice()
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

                return candidates[0] ?? null;
            }),
            tap((match) => {
                if (!match) return;
                const mapped = this.mapToAssessmentResult(moduleId, match);
                this.state.setResult(mapped);
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    /**
     * Pulls the latest completed evaluations from backend and stores them locally
     * so Home cards reflect real outcomes even after reload/storage clear.
     */
    hydrateLatestCompletedResults(): Observable<void> {
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) => this.pickLatestPerModule(items)),
            tap((latest) => {
                // Source of truth: if backend doesn't report a completed evaluation for a module,
                // we must NOT keep a stale local result around (prevents cross-user/localStorage leaks).
                const existing = this.state.getAllResults();
                const latestModuleIds = new Set(Object.keys(latest ?? {}));

                for (const moduleId of Object.keys(existing ?? {})) {
                    if (!latestModuleIds.has(moduleId)) {
                        this.state.clearModule(moduleId as unknown as AssessmentModuleId);
                    }
                }

                for (const [moduleId, item] of Object.entries(latest) as Array<[AssessmentModuleId, SwaggerEvaluationWithResultDto]>) {
                    const result = this.mapToAssessmentResult(moduleId, item);
                    const existing = this.state.getResult(moduleId);

                    // Update if the hydrated result is newer OR if it can enrich an existing
                    // result that lacks dimensions/recommendations/resultId.
                    const shouldReplace = this.isNewer(existing?.evaluatedAt, result.evaluatedAt);
                    const canEnrichExisting =
                        !!existing &&
                        (
                            (!existing.evaluationResultId && !!result.evaluationResultId) ||
                            ((existing.dimensions ?? []).length === 0 && (result.dimensions ?? []).length > 0) ||
                            ((existing.recommendations ?? []).length === 0 && (result.recommendations ?? []).length > 0)
                        );

                    if (shouldReplace) {
                        this.state.setResult(result);
                        continue;
                    }

                    if (canEnrichExisting) {
                        this.state.setResult({
                            ...existing,
                            evaluationId: existing.evaluationId ?? result.evaluationId,
                            evaluationResultId: existing.evaluationResultId ?? result.evaluationResultId,
                            dimensions: (existing.dimensions ?? []).length ? existing.dimensions : result.dimensions,
                            recommendations: (existing.recommendations ?? []).length ? existing.recommendations : result.recommendations,
                        });
                    }
                }
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    /**
     * Hydrates the current module result by matching its evaluationId against
     * `/evaluation/my-completed` (more reliable than module-name heuristics).
     */
    hydrateCurrentModuleResultIfMissing(moduleId: AssessmentModuleId): Observable<void> {
        const current = this.state.getResult(moduleId);
        const evaluationId = current?.evaluationId;

        if (!current) return of(void 0);
        if (!evaluationId || evaluationId <= 0) return of(void 0);

        const needsHydration =
            !current.evaluationResultId ||
            (current.dimensions ?? []).length === 0 ||
            (current.recommendations ?? []).length === 0;

        if (!needsHydration) return of(void 0);

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) =>
                (items ?? []).find((i: any) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) === evaluationId) ?? null
            ),
            tap((match) => {
                if (!match) return;

                const hydrated = this.mapToAssessmentResult(moduleId, match);
                const latest = this.state.getResult(moduleId);
                if (!latest) return;

                // Enrich only the missing pieces (no mock data).
                this.state.setResult({
                    ...latest,
                    evaluationId: latest.evaluationId ?? hydrated.evaluationId,
                    evaluationResultId: latest.evaluationResultId ?? hydrated.evaluationResultId,
                    dimensions: (latest.dimensions ?? []).length ? latest.dimensions : hydrated.dimensions,
                    recommendations: (latest.recommendations ?? []).length ? latest.recommendations : hydrated.recommendations,
                    headline: latest.headline || hydrated.headline,
                    message: latest.message || hydrated.message,
                });
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    /**
     * Ensures recommendations are pulled from the backend recommendation endpoint
     * for the currently stored module result (no mock/fallback data).
     */
    hydrateRecommendationsIfMissing(moduleId: AssessmentModuleId): Observable<void> {
        const current = this.state.getResult(moduleId);
        const evaluationResultId = current?.evaluationResultId;

        if (!current) return of(void 0);
        if (!evaluationResultId || evaluationResultId <= 0) return of(void 0);
        if ((current.recommendations ?? []).length > 0) return of(void 0);

        return this.http.get<unknown>(`${this.apiUrl}/recommendation/by-result/${evaluationResultId}`).pipe(
            map((res) => this.unwrapArray<SwaggerRecommendationDto>(res)),
            map((items) =>
                (items ?? [])
                    .map((r: any) => String(r?.recommendationText ?? r?.description ?? r?.text ?? r?.title ?? '').trim())
                    .filter(Boolean)
            ),
            tap((recs) => {
                if (!recs.length) return;
                const latest = this.state.getResult(moduleId);
                if (!latest) return;
                if ((latest.recommendations ?? []).length > 0) return;
                this.state.setResult({
                    ...latest,
                    recommendations: recs,
                });
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    private mapToAssessmentResult(moduleId: AssessmentModuleId, item: SwaggerEvaluationWithResultDto): AssessmentResult {
        const anyItem = item as any;
        const result = anyItem?.result as any;

        const evalId = Number(result?.evaluationID ?? result?.evaluationId ?? anyItem?.evaluationID ?? anyItem?.evaluationId ?? 0);
        const evalResultId = Number(result?.evaluationResultID ?? result?.evaluationResultId ?? 0);

        const outcome = this.mapRiskLevelToOutcome(result?.riskLevel);
        const score = Math.round(Math.max(0, Math.min(100, result?.scorePercentage ?? 0)));

        return {
            moduleId,
            evaluationId: Number.isFinite(evalId) && evalId > 0 ? evalId : undefined,
            evaluationResultId: Number.isFinite(evalResultId) && evalResultId > 0 ? evalResultId : undefined,
            outcome,
            score,
            evaluatedAt: result?.calculatedAt ?? item.completedAt,
            headline: String(result?.riskLevel ?? ''),
            message: result?.interpretation || '',
            dimensions: ((result?.dimensionScores ?? []) as any[]).map((d) => ({
                id: String(d?.dimensionScoreID ?? d?.dimensionScoreId ?? ''),
                label: d?.dimensionName ?? '',
                percent: this.safePercent(Number(d?.score ?? 0), Number(d?.maxScore ?? 0)),
            })),
            recommendations: ((result?.recommendations ?? []) as any[])
                .map((r) => String(r?.recommendationText ?? r?.description ?? r?.text ?? r?.title ?? '').trim())
                .filter(Boolean),
        };
    }

    private safePercent(score: number, maxScore: number): number {
        const s = Number(score ?? 0);
        const max = Number(maxScore ?? 0);
        if (!max || Number.isNaN(s) || Number.isNaN(max)) return 0;
        return Math.round(Math.max(0, Math.min(100, (s / max) * 100)));
    }

    private unwrapArray<T>(res: unknown): T[] {
        const anyRes = this.normalizeResponse(res) as any;
        if (Array.isArray(anyRes)) return anyRes as T[];
        if (anyRes?.success === true) return (anyRes.data ?? []) as T[];
        return [];
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

    private mapRiskLevelToOutcome(risk: RiskLevel | null | undefined): AssessmentOutcome {
        const value = String(risk ?? '').toLowerCase();
        if (value.includes('green') || value.includes('low')) return 'adequate';
        if (value.includes('yellow') || value.includes('medium')) return 'mild';
        if (value.includes('red') || value.includes('high')) return 'high-risk';
        return 'mild';
    }

    private mapModuleNameToAssessmentModuleId(moduleName: string | undefined): AssessmentModuleId | null {
        const name = (moduleName ?? '').toLowerCase();
        if (!name) return null;
        if (name.includes('mental') || name.includes('salud')) return 'mental-health';
        if (name.includes('fatiga') || name.includes('fatigue')) return 'work-fatigue';
        if (name.includes('clima') || name.includes('climate')) return 'organizational-climate';
        if (name.includes('psicosocial')) return 'psychosocial-risk';
        return null;
    }

    private pickLatestPerModule(items: SwaggerEvaluationWithResultDto[]): Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto>> {
        const result: Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto>> = {};

        for (const e of items ?? []) {
            const moduleId = this.mapModuleNameToAssessmentModuleId(e?.assessmentModuleName ?? undefined);
            if (!moduleId) continue;

            const existing = result[moduleId];
            if (!existing) {
                result[moduleId] = e;
                continue;
            }

            if (this.isNewer(existing.completedAt, e.completedAt)) {
                result[moduleId] = e;
            }
        }

        return result;
    }

    private isNewer(existingIso: string | undefined, nextIso: string | undefined): boolean {
        if (!nextIso) return false;
        if (!existingIso) return true;
        const existingTime = Date.parse(existingIso);
        const nextTime = Date.parse(nextIso);
        if (Number.isNaN(nextTime)) return false;
        if (Number.isNaN(existingTime)) return true;
        return nextTime > existingTime;
    }
}
