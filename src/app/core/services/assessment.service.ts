import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AssessmentModuleId,
    AssessmentOutcome,
    AssessmentQuestion,
    AssessmentResult,
} from 'app/core/models/assessment.model';
import { ASSESSMENT_MODULES, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { environment } from '../../../environments/environment';
import {
    Observable,
    catchError,
    map,
    of,
    shareReplay,
    switchMap,
    throwError,
} from 'rxjs';
import { ConsentService } from './consent.service';

type RiskLevel = 'Green' | 'Yellow' | 'Red' | 'Low' | 'Medium' | 'High';

// â”€â”€ V5 DTOs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SwaggerAssessmentModuleDto {
    moduleID: number;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    isActive?: boolean;
    // legacy fallback fields (some endpoints may still return old names)
    assessmentModuleID?: number;
    moduleName?: string | null;
    instrumentType?: string | null;
}

interface SwaggerQuestionOptionDto {
    optionID?: number;
    questionOptionID?: number;  // legacy
    optionText?: string | null;
    numericValue?: number;      // V5
    optionValue?: number;       // legacy fallback
    displayOrder?: number;      // V5
    orderIndex?: number;        // legacy fallback
}

interface SwaggerQuestionDto {
    questionID: number;
    questionText?: string | null;
    questionNumber?: number;    // V5
    orderIndex?: number;        // legacy fallback
    options?: SwaggerQuestionOptionDto[] | null;
}

interface SwaggerInstrumentDto {
    instrumentID?: number;
    questions?: SwaggerQuestionDto[] | null;
}

interface SwaggerModuleFullDto {
    moduleID?: number;
    assessmentModuleID?: number;  // legacy fallback
    name?: string | null;
    moduleName?: string | null;   // legacy fallback
    instruments?: SwaggerInstrumentDto[] | null;
    // legacy: some backends return questions directly on module
    questions?: SwaggerQuestionDto[] | null;
}

interface SwaggerEvaluationDto {
    evaluationID: number;
    moduleID?: number;              // V5
    assessmentModuleID?: number;    // legacy fallback
    assessmentModuleName?: string | null;
    startedAt: string;
    completedAt?: string | null;
    status?: string | null;
    isCompleted: boolean;
}

interface SwaggerDimensionScoreDto {
    dimensionScoreID: number;
    dimensionName?: string | null;
    score: number;
    maxScore: number;
    riskLevel?: RiskLevel | string | null;
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
export class AssessmentService {
    private readonly apiUrl = environment.apiUrl;

    private readonly modules$ = this.http
        .get<unknown>(`${this.apiUrl}/assessmentmodule/modules/active`)
        .pipe(
            map((res) => {
                const modules = this.unwrapArray<SwaggerAssessmentModuleDto>(res);
                return modules ?? [];
            }),
            shareReplay({ bufferSize: 1, refCount: false })
        );

    private readonly moduleDetailCache = new Map<AssessmentModuleId, { apiModuleId: number; questions: SwaggerQuestionDto[] }>();

    constructor(
        private readonly http: HttpClient,
        private readonly consentService: ConsentService
    ) { }

    /**
     * Returns the list of known frontend modules that are currently active in the backend.
     * This avoids showing hardcoded/fallback modules when the API doesn't provide them.
     */
    getActiveModuleIds(): Observable<AssessmentModuleId[]> {
        return this.modules$.pipe(
            map((modules) => {
                const result: AssessmentModuleId[] = [];
                for (const def of ASSESSMENT_MODULES) {
                    const match = this.findBestModuleMatch(def.id, modules);
                    if (this.getModuleId(match)) {
                        result.push(def.id);
                    }
                }
                return result;
            })
        );
    }

    getQuestions(moduleId: AssessmentModuleId): Observable<AssessmentQuestion[]> {
        return this.resolveApiModuleId(moduleId).pipe(
            switchMap((apiModuleId) =>
                this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/${apiModuleId}/full`)
            ),
            map((res) => {
                const moduleData = this.unwrapObject<SwaggerModuleFullDto>(res);
                const resolvedId = this.getModuleId(moduleData);
                if (!resolvedId) {
                    throw new Error('No fue posible obtener el módulo');
                }

                // V5: questions live inside instruments; legacy: directly on module
                const questions = this.extractQuestions(moduleData);
                const apiModuleId = resolvedId;

                this.moduleDetailCache.set(moduleId, { apiModuleId, questions });

                return questions.map((q) => ({
                    id: q.questionID,
                    text: q.questionText ?? '',
                    options: this.sortOptions(q.options ?? []).map((o) => o.optionText ?? ''),
                }));
            })
        );
    }

    submit(moduleId: AssessmentModuleId, answers: number[]): Observable<AssessmentResult> {
        // Evaluation/start requires consent accepted.
        return this.consentService.hasAccepted().pipe(
            switchMap((hasAccepted) =>
                hasAccepted
                    ? of(true)
                    : throwError(() => ({
                        code: 'CONSENT_REQUIRED',
                        message: 'Debes aceptar el consentimiento informado antes de iniciar la evaluación.',
                    }))
            ),
            switchMap(() => this.getModuleDetail(moduleId)),
            switchMap((detail) =>
                this.getInProgressEvaluation(detail.apiModuleId).pipe(
                    switchMap((existing) => {
                        if (existing?.evaluationID) {
                            return of(existing);
                        }

                        return this.http
                            .post<unknown>(`${this.apiUrl}/evaluation/start`, {
                                moduleID: detail.apiModuleId,
                            })
                            .pipe(
                                map((res) => {
                                    const evaluation = this.unwrapObject<SwaggerEvaluationDto>(res);
                                    if (!evaluation?.evaluationID) {
                                        throw new Error('No fue posible iniciar la evaluación');
                                    }
                                    return evaluation;
                                })
                            );
                    }),
                    switchMap((evaluation) =>
                        this.submitAllResponses(evaluation.evaluationID, detail.questions, answers).pipe(
                            switchMap(() =>
                                this.http
                                    .post<unknown>(`${this.apiUrl}/evaluation/${evaluation.evaluationID}/complete`, null)
                                    .pipe(
                                        map((res) => this.unwrapObject<SwaggerEvaluationResultDto>(res) as SwaggerEvaluationResultDto),
                                        switchMap((result: SwaggerEvaluationResultDto) =>
                                            result?.evaluationResultID
                                                ? of(result)
                                                : this.loadCompletedResultForEvaluation(evaluation.evaluationID)
                                        )
                                    )
                            ),
                            catchError((err) =>
                                this.loadCompletedResultForEvaluation(evaluation.evaluationID).pipe(
                                    switchMap((result: SwaggerEvaluationResultDto | null) =>
                                        result?.evaluationResultID
                                            ? of(result)
                                            : throwError(() => err)
                                    )
                                )
                            ),
                            map((result: SwaggerEvaluationResultDto | null) => {
                                if (!result?.evaluationResultID) {
                                    throw new Error('No fue posible completar la evaluación');
                                }
                                return result;
                            })
                        )
                    ),
                    map((completed: SwaggerEvaluationResultDto) => this.mapToAssessmentResult(moduleId, completed))
                )
            )
        );
    }

    getMyCompletedEvaluationsWithResult(): Observable<SwaggerEvaluationWithResultDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res) ?? [])
        );
    }

    private getInProgressEvaluation(apiModuleId: number): Observable<SwaggerEvaluationDto | null> {
        if (!apiModuleId) return of(null);

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/in-progress/${apiModuleId}`).pipe(
            map((res) => {
                const evaluation = this.unwrapObject<SwaggerEvaluationDto>(res);
                return evaluation?.evaluationID ? evaluation : null;
            }),
            catchError(() => of(null))
        );
    }

    private loadCompletedResultForEvaluation(evaluationId: number): Observable<SwaggerEvaluationResultDto | null> {
        if (!evaluationId) return of(null);
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res)),
            map((items) => {
                const match = (items ?? []).find((i: any) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) === evaluationId);
                return match?.result ?? null;
            }),
            catchError(() => of(null))
        );
    }

    private resolveApiModuleId(moduleId: AssessmentModuleId): Observable<number> {
        return this.modules$.pipe(
            map((modules) => {
                const match = this.findBestModuleMatch(moduleId, modules);
                const id = this.getModuleId(match);
                if (!id) {
                    throw new Error(`No se encontró el módulo backend para '${moduleId}'`);
                }
                return id;
            })
        );
    }

    private getModuleDetail(moduleId: AssessmentModuleId): Observable<{ apiModuleId: number; questions: SwaggerQuestionDto[] }> {
        const cached = this.moduleDetailCache.get(moduleId);
        if (cached) return of(cached);

        return this.getQuestions(moduleId).pipe(
            switchMap(() => {
                const next = this.moduleDetailCache.get(moduleId);
                if (!next) {
                    throw new Error('No fue posible preparar el cuestionario');
                }
                return of(next);
            })
        );
    }

    private submitAllResponses(evaluationId: number, questions: SwaggerQuestionDto[], answers: number[]): Observable<unknown> {
        const responses = questions.map((q, index) => {
            const options = this.sortOptions(q.options ?? []);
            const rawAnswer = answers[index];
            const asNumber = Number(rawAnswer);

            // answers are 0-based option indices from the questionnaire component
            let optionIndex = Number.isFinite(asNumber) ? asNumber : 0;

            if (optionIndex < 0 || optionIndex > options.length - 1) {
                // try matching by numericValue (legacy optionValue fallback)
                const byValue = options.findIndex((o) => Number(o?.numericValue ?? o?.optionValue) === asNumber);
                optionIndex = byValue >= 0 ? byValue : 0;
            }

            optionIndex = Math.max(0, Math.min(options.length - 1, optionIndex));
            const selected = options[optionIndex] ?? options[0];
            const selectedValue = Number(selected?.numericValue ?? selected?.optionValue ?? optionIndex);

            return { questionID: q.questionID, selectedValue };
        });

        // V5 API: use respond-multiple for a single atomic call
        return this.http.post<unknown>(`${this.apiUrl}/evaluation/respond-multiple`, {
            evaluationID: evaluationId,
            responses,
        });
    }

    /** Extract questions from V5 (instruments â†’ questions) or legacy (direct questions). */
    private extractQuestions(moduleData: SwaggerModuleFullDto): SwaggerQuestionDto[] {
        if (moduleData?.instruments?.length) {
            const all: SwaggerQuestionDto[] = [];
            for (const instrument of moduleData.instruments) {
                for (const q of instrument.questions ?? []) {
                    all.push(q);
                }
            }
            return all.slice().sort((a, b) =>
                (a.questionNumber ?? a.orderIndex ?? 0) - (b.questionNumber ?? b.orderIndex ?? 0)
            );
        }
        return (moduleData?.questions ?? []).slice().sort((a, b) =>
            (a.questionNumber ?? a.orderIndex ?? 0) - (b.questionNumber ?? b.orderIndex ?? 0)
        );
    }

    /** Sort options by displayOrder (V5) or orderIndex (legacy). */
    private sortOptions(options: SwaggerQuestionOptionDto[]): SwaggerQuestionOptionDto[] {
        return options.slice().sort((a, b) =>
            (a.displayOrder ?? a.orderIndex ?? 0) - (b.displayOrder ?? b.orderIndex ?? 0)
        );
    }

    /** Get numeric module ID from either V5 (moduleID) or legacy (assessmentModuleID) DTO. */
    private getModuleId(module: SwaggerAssessmentModuleDto | SwaggerModuleFullDto | undefined | null): number {
        if (!module) return 0;
        const anyM = module as any;
        return Number(anyM?.moduleID ?? anyM?.assessmentModuleID ?? 0);
    }

    private mapToAssessmentResult(
        moduleId: AssessmentModuleId,
        result: SwaggerEvaluationResultDto
    ): AssessmentResult {
        const anyRes = result as any;
        const evaluationId = Number(anyRes?.evaluationID ?? anyRes?.evaluationId ?? 0);
        const evaluationResultId = Number(anyRes?.evaluationResultID ?? anyRes?.evaluationResultId ?? 0);

        const outcome = this.mapRiskLevelToOutcome((anyRes?.riskLevel ?? '') as RiskLevel);
        const score = Math.round(Math.max(0, Math.min(100, anyRes?.scorePercentage ?? 0)));

        return {
            moduleId,
            evaluationId: Number.isFinite(evaluationId) && evaluationId > 0 ? evaluationId : undefined,
            evaluationResultId: Number.isFinite(evaluationResultId) && evaluationResultId > 0 ? evaluationResultId : undefined,
            outcome,
            score,
            evaluatedAt: anyRes?.calculatedAt,
            headline: this.mapRiskLevelToSpanish((anyRes?.riskLevel ?? '') as RiskLevel),
            message: this.buildInterpretationMessage(outcome, score),
            dimensions: ((anyRes?.dimensionScores ?? []) as any[]).map((d) => ({
                id: String(d?.dimensionScoreID ?? d?.dimensionScoreId ?? ''),
                label: d?.dimensionName ?? '',
                instrumentCode: String(d?.instrumentCode ?? '').toUpperCase().trim() || undefined,
                percent: d?.percentageScore != null
                    ? Math.round(Math.max(0, Math.min(100, Number(d.percentageScore))))
                    : this.safePercent(Number(d?.score ?? 0), Number(d?.maxScore ?? 0)),
            })),
            recommendations: ((anyRes?.recommendations ?? []) as any[])
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

    private mapRiskLevelToOutcome(risk: RiskLevel): AssessmentOutcome {
        const value = String(risk ?? '').toLowerCase();
        if (value.includes('green') || value.includes('low')) return 'adequate';
        if (value.includes('yellow') || value.includes('medium')) return 'mild';
        if (value.includes('red') || value.includes('high')) return 'high-risk';
        return 'mild';
    }

    private mapRiskLevelToSpanish(risk: RiskLevel | string): string {
        const value = String(risk ?? '').toLowerCase();
        if (value.includes('low')    || value.includes('green'))                          return 'Riesgo Bajo';
        if (value.includes('medium') || value.includes('yellow') || value.includes('moderate')) return 'Riesgo Moderado';
        if (value.includes('severe'))                                                     return 'Riesgo Severo';
        if (value.includes('high')   || value.includes('red'))                           return 'Riesgo Alto';
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

    private findBestModuleMatch(moduleId: AssessmentModuleId, modules: SwaggerAssessmentModuleDto[]): SwaggerAssessmentModuleDto | undefined {
        const moduleDef = getAssessmentModuleDefinition(moduleId);
        const candidates = modules.filter((m) => m.isActive !== false);

        // Helper accessors for V5 (name/code) and legacy (moduleName/instrumentType)
        const byCode = (needle: string) => candidates.find((m) => (m.code ?? '').toLowerCase().includes(needle));
        const byName = (needle: string) => candidates.find((m) => (m.name ?? m.moduleName ?? '').toLowerCase().includes(needle));
        const byExactName = (needle: string) => candidates.find((m) => (m.name ?? m.moduleName ?? '').toLowerCase() === needle);
        const byType = (needle: string) => candidates.find((m) => (m.instrumentType ?? '').toLowerCase().includes(needle));

        const defTitle = (moduleDef.title ?? '').toLowerCase();
        if (defTitle) {
            const exact = byExactName(defTitle);
            if (exact) return exact;
        }

        switch (moduleId) {
            case 'mental-health':
                return byCode('mental') ?? byType('mental') ?? byName('salud') ?? byName('mental');
            case 'work-fatigue':
                return byCode('fatigue') ?? byCode('fatiga') ?? byType('fatigue') ?? byName('fatiga');
            case 'organizational-climate':
                return byCode('climate') ?? byCode('clima') ?? byType('climate') ?? byName('clima');
            case 'psychosocial-risk':
                return byCode('psychosocial') ?? byCode('psicosocial') ?? byType('psychosocial') ?? byName('psicosocial');
        }
    }
}

