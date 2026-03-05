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
    /** Numeric module ID — available since backend v5.1 (was already present). */
    moduleID?: number | null;
    /** Instrument code for this evaluation (e.g. "DASS21", "BAI").
     *  null for sub-scale instruments — infer from result.dimensionScores[].instrumentCode. */
    instrumentCode?: string | null;
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
     * Returns the set of completed instrument codes for a given module.
     * Uses both:
     *  - `instrumentCode` field on each evaluation item (backend v5.2+, direct for simple instruments)
     *  - `result.dimensionScores[].instrumentCode` (for sub-scale instruments like DASS-21)
     * The returned set contains uppercase codes ready for comparison.
     */
    getCompletedInstrumentCodes(moduleId: AssessmentModuleId): Observable<Set<string>> {
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res) ?? []),
            map((items) => {
                const codes = new Set<string>();
                const moduleItems = items.filter((i) => this.resolveModuleId(i) === moduleId);
                for (const item of moduleItems) {
                    // Direct instrumentCode on the evaluation item (simple instruments)
                    const direct = String(item?.instrumentCode ?? '').toUpperCase().trim();
                    if (direct) codes.add(direct);
                    // Sub-scale instrumentCode from dimensionScores (e.g. DASS21_ANXIETY → DASS21)
                    for (const dim of item?.result?.dimensionScores ?? []) {
                        const dc = String((dim as any)?.instrumentCode ?? '').toUpperCase().trim();
                        if (dc) codes.add(dc);
                    }
                }
                return codes;
            }),
            catchError(() => of(new Set<string>()))
        );
    }

    /**
     * Hydrates a single module result from `/evaluation/my-completed`.
     * When no specific evaluationId is given, it collects ALL evaluations for the module
     * and merges their dimensions so that multi-instrument modules (e.g. DASS-21 + BAI)
     * show every completed instrument on the results page after a reload.
     */
    hydrateModuleResultFromCompletedEvaluations(moduleId: AssessmentModuleId, evaluationId?: number): Observable<void> {
        const targetEvaluationId = Number(evaluationId ?? 0);

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) => {
                const all = items ?? [];

                if (Number.isFinite(targetEvaluationId) && targetEvaluationId > 0) {
                    // Deep-link to a specific evaluation — return just that one
                    return (
                        all.find((i: any) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) === targetEvaluationId) ??
                        null
                    );
                }

                // Return ALL evaluations for this module sorted newest-first so we can merge them
                const candidates = all
                    .filter((i) => this.resolveModuleId(i) === moduleId)
                    .slice()
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

                return candidates.length ? candidates : null;
            }),
            tap((matchOrList) => {
                if (!matchOrList) return;

                if (Array.isArray(matchOrList)) {
                    const merged = this.mergeEvaluationsForModule(moduleId, matchOrList);
                    if (merged) this.state.setResult(merged);
                } else {
                    const mapped = this.mapToAssessmentResult(moduleId, matchOrList);
                    this.state.setResult(mapped);
                }
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    /**
     * Pulls the latest completed evaluations from backend and stores them locally
     * so Home cards reflect real outcomes even after reload/storage clear.
     * For multi-instrument modules, all evaluations are merged so no dimension is lost.
     */
    hydrateLatestCompletedResults(): Observable<void> {
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) => this.groupAllByModule(items)),
            tap((grouped) => {
                // Source of truth: if backend doesn't report a completed evaluation for a module,
                // we must NOT keep a stale local result around (prevents cross-user/localStorage leaks).
                const existing = this.state.getAllResults();
                const groupedModuleIds = new Set(Object.keys(grouped ?? {}));

                for (const moduleId of Object.keys(existing ?? {})) {
                    if (!groupedModuleIds.has(moduleId)) {
                        this.state.clearModule(moduleId as unknown as AssessmentModuleId);
                    }
                }

                for (const [moduleId, evaluations] of Object.entries(grouped) as Array<[AssessmentModuleId, SwaggerEvaluationWithResultDto[]]>) {
                    const merged = this.mergeEvaluationsForModule(moduleId, evaluations);
                    if (!merged) continue;
                    // Backend siempre gana — reemplazar sin preservar caché
                    this.state.setResult(merged);
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
                // Backend siempre gana — reemplazar directamente
                const hydrated = this.mapToAssessmentResult(moduleId, match);
                this.state.setResult(hydrated);
            }),
            map(() => void 0),
            catchError(() => of(void 0))
        );
    }

    /**
     * Ensures recommendations are pulled from the backend recommendation endpoint
     * for the currently stored module result (no mock/fallback data).
     * Used as a last-resort pass after hydrateCurrentModuleResultIfMissing in case
     * my-completed returned recommendations empty (should not happen post-backend fix).
     */
    hydrateRecommendationsIfMissing(moduleId: AssessmentModuleId): Observable<void> {
        const current = this.state.getResult(moduleId);
        const evaluationResultId = current?.evaluationResultId;

        if (!current) return of(void 0);
        if (!evaluationResultId || evaluationResultId <= 0) {
            return of(void 0);
        }
        if ((current.recommendations ?? []).length > 0) {
            return of(void 0);
        }

        return this.http.get<unknown>(`${this.apiUrl}/recommendation/by-result/${evaluationResultId}`).pipe(
            map((res) => {
                return this.unwrapArray<SwaggerRecommendationDto>(res);
            }),
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
            catchError((err) => { console.error('[Hydration] ERROR /recommendation/by-result:', err); return of(void 0); })
        );
    }

    /**
     * Calls `GET /api/evaluation/{evaluationId}/result` to fetch the full result
     * including dimensionScores and recommendations when my-completed doesn't include them.
     * @deprecated Backend now returns dimensionScores and recommendations directly in
     * my-completed. This method is kept as a safety net but should no longer be needed.
     */
    hydrateDimensionsFromEvaluationResult(moduleId: AssessmentModuleId): Observable<void> {
        const current = this.state.getResult(moduleId);
        const evaluationId = current?.evaluationId;

        if (!current) return of(void 0);
        if (!evaluationId || evaluationId <= 0) return of(void 0);

        const needsDimensions = (current.dimensions ?? []).length === 0;
        const needsRecs = (current.recommendations ?? []).length === 0;
        if (!needsDimensions && !needsRecs) return of(void 0);

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/${evaluationId}/result`).pipe(
            map((res) => {
                const anyRes = this.normalizeResponse(res) as any;
                // Unwrap envelope if needed
                if (anyRes?.success === true) return anyRes.data as any;
                return anyRes;
            }),
            tap((result: any) => {
                if (!result) return;
                const latest = this.state.getResult(moduleId);
                if (!latest) return;

                const evalResultId = Number(result?.evaluationResultID ?? result?.evaluationResultId ?? 0);
                const dims = ((result?.dimensionScores ?? []) as any[]).map((d: any) => ({
                    id: String(d?.dimensionScoreID ?? d?.dimensionScoreId ?? ''),
                    label: d?.dimensionName ?? '',
                    instrumentCode: String(d?.instrumentCode ?? '').toUpperCase().trim() || undefined,
                    score: Number(d?.score ?? d?.rawScore ?? 0),
                    maxScore: Number(d?.maxScore ?? 0),
                    riskLevel: d?.riskLevel ?? undefined,
                    scoreRangeLabel: d?.scoreRangeLabel ?? undefined,
                    scoreRangeColor: d?.scoreRangeColor ?? undefined,
                    percent: Math.round(Number(d?.percentageScore ?? 0)),
                }));
                const recs = ((result?.recommendations ?? []) as any[])
                    .map((r: any) => String(r?.recommendationText ?? r?.description ?? r?.text ?? r?.title ?? '').trim())
                    .filter(Boolean);

                this.state.setResult({
                    ...latest,
                    evaluationResultId: evalResultId > 0 ? evalResultId : latest.evaluationResultId,
                    dimensions: dims,
                    recommendations: recs.length ? recs : (latest.recommendations ?? []),
                    headline: latest.headline || String(result?.riskLevel ?? ''),
                    message: latest.message || String(result?.interpretation ?? ''),
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
            totalScore: result?.totalScore != null ? Number(result.totalScore) : undefined,
            score,
            evaluatedAt: result?.calculatedAt ?? item.completedAt,
            headline: this.mapRiskLevelToSpanish(result?.riskLevel),
            message: String(result?.interpretation ?? '').trim() || this.buildInterpretationMessage(outcome, score),
            dimensions: ((result?.dimensionScores ?? []) as any[]).map((d) => ({
                id: String(d?.dimensionScoreID ?? d?.dimensionScoreId ?? ''),
                label: d?.dimensionName ?? '',
                instrumentCode: String(d?.instrumentCode ?? '').toUpperCase().trim() || undefined,
                score: Number(d?.score ?? d?.rawScore ?? 0),
                maxScore: Number(d?.maxScore ?? 0),
                riskLevel: d?.riskLevel ?? undefined,
                scoreRangeLabel: d?.scoreRangeLabel ?? undefined,
                scoreRangeColor: d?.scoreRangeColor ?? undefined,
                scoreRangeDescription: d?.scoreRangeDescription ?? undefined,
                percent: Math.round(Number(d?.percentageScore ?? 0)),
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

    private mapRiskLevelToSpanish(risk: RiskLevel | null | undefined): string {
        const value = String(risk ?? '').toLowerCase();
        if (value.includes('low')    || value.includes('green')) return 'Riesgo Bajo';
        if (value.includes('medium') || value.includes('yellow') || value.includes('moderate')) return 'Riesgo Moderado';
        if (value.includes('severe')) return 'Riesgo Severo';
        if (value.includes('high')   || value.includes('red'))   return 'Riesgo Alto';
        return 'Resultado disponible';
    }

    private buildInterpretationMessage(outcome: AssessmentOutcome, score: number): string {
        switch (outcome) {
            case 'adequate':
                return `Tu puntaje es ${score}/100. Los indicadores se encuentran dentro de rangos saludables. Continúa con tus hábitos de bienestar.`;
            case 'mild':
                return `Tu puntaje es ${score}/100. Se detectaron algunas señales que vale la pena atender. Te recomendamos revisar las sugerencias personalizadas.`;
            case 'high-risk':
                return `Tu puntaje es ${score}/100. Los resultados indican niveles elevados que requieren atención. Te recomendamos buscar orientación profesional.`;
        }
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

    /**
     * Resolves the frontend AssessmentModuleId from a completed-evaluation DTO.
     * Prefers the numeric `moduleID` field (backend v5.1+) and falls back to
     * keyword-matching on `assessmentModuleName` for older responses.
     */
    private resolveModuleId(item: SwaggerEvaluationWithResultDto): AssessmentModuleId | null {
        // Numeric moduleID → use a static lookup table built from known module IDs.
        // Because the numeric ID can vary per environment we can't hardcode it here,
        // so we fall through to name matching which works universally.
        // If moduleID is present AND the name also resolves, name takes precedence only
        // as a sanity check. In practice, name-matching covers all current modules.
        return this.mapModuleNameToAssessmentModuleId(item?.assessmentModuleName ?? undefined);
    }

    /**
     * Groups ALL completed evaluations by module.
     * Returns every evaluation per module (not just the latest) so that
     * multi-instrument modules can merge all their dimensions.
     */
    private groupAllByModule(items: SwaggerEvaluationWithResultDto[]): Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto[]>> {
        const result: Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto[]>> = {};

        for (const e of items ?? []) {
            const moduleId = this.resolveModuleId(e);
            if (!moduleId) continue;
            if (!result[moduleId]) result[moduleId] = [];
            result[moduleId]!.push(e);
        }

        // Sort each group newest-first
        for (const key of Object.keys(result) as AssessmentModuleId[]) {
            result[key]!.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        }

        return result;
    }

    /**
     * Merges a list of evaluations for the same module into a single AssessmentResult.
     * The most recent evaluation provides the aggregate score/outcome/headline.
     * All dimensions from all evaluations are union-merged (by instrumentCode then id).
     */
    private mergeEvaluationsForModule(moduleId: AssessmentModuleId, evaluations: SwaggerEvaluationWithResultDto[]): AssessmentResult | null {
        if (!evaluations.length) return null;

        // Most recent first (already sorted by caller but sort again to be safe)
        const sorted = evaluations.slice().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        // Base result from the most recent evaluation
        const base = this.mapToAssessmentResult(moduleId, sorted[0]);

        // Accumulate dimensions from older evaluations
        const allDims = [...base.dimensions];
        for (const older of sorted.slice(1)) {
            const olderResult = this.mapToAssessmentResult(moduleId, older);
            for (const dim of olderResult.dimensions) {
                const byCode = dim.instrumentCode
                    ? allDims.findIndex(
                          (d) => d.instrumentCode && d.instrumentCode.toUpperCase() === dim.instrumentCode!.toUpperCase()
                      )
                    : -1;
                const byId = allDims.findIndex((d) => d.id === dim.id && dim.id);
                const replaceIdx = byCode >= 0 ? byCode : byId;
                if (replaceIdx < 0) {
                    allDims.push(dim); // dimension from older instrument not yet in list
                }
                // If already present (same instrumentCode/id), keep the newer one (already in allDims)
            }

            // Merge recommendations (union)
            for (const rec of olderResult.recommendations ?? []) {
                if (!base.recommendations.includes(rec)) base.recommendations.push(rec);
            }
        }

        return { ...base, dimensions: allDims };
    }

    private pickLatestPerModule(items: SwaggerEvaluationWithResultDto[]): Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto>> {
        const result: Partial<Record<AssessmentModuleId, SwaggerEvaluationWithResultDto>> = {};

        for (const e of items ?? []) {
            const moduleId = this.resolveModuleId(e);
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