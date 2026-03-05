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

/** Detailed answer for a single question, used by submitRich(). */
export interface RichAnswer {
    /** Frontend question id */
    questionId: number;
    /** Option index for LIKERT/ROUTING; integer value for INTEGER; null for TIME */
    value: number | null;
    /** Free text for TIME or ROUTING companion field */
    text: string | null;
    /** Sub-item answers keyed by sub-question id (ICSP_VC) */
    subAnswers?: { questionId: number; value: number | null; text: string | null }[];
}
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
    endsTest?: boolean;         // Schema v2: si true, esta opción finaliza la evaluación
}

type QuestionType = 'LIKERT' | 'TIME' | 'INTEGER' | 'ROUTING';

interface SwaggerQuestionDto {
    questionID: number;
    questionText?: string | null;
    questionNumber?: number;        // V5 (antes: questionOrder)
    orderIndex?: number;            // legacy fallback
    options?: SwaggerQuestionOptionDto[] | null;
    // Schema v2
    questionType?: QuestionType;    // LIKERT | TIME | INTEGER | ROUTING
    parentQuestionID?: number | null;
    subItemLabel?: string | null;   // ej. "a", "b", "c"
    enableTextIfValue?: number | null; // activa campo de texto si selectedValue == este número
    subItems?: SwaggerQuestionDto[]; // preguntas hijas (ej. P5a-P5j en ICSP-VC)
}

interface SwaggerInstrumentScoreRangeDto {
    scoreRangeID?: number;              // Schema v2 (antes: instrumentScoreRangeID)
    instrumentScoreRangeID?: number;    // legacy fallback
    instrumentID?: number;
    dimensionCode?: string | null;      // Schema v2: subescala (ej. "ESTRES", "PERCEPCION")
    gender?: 'M' | 'F' | null;         // Schema v2: género (solo TMMS-24). null = aplica a todos
    rangeLevel?: string | null;
    label?: string | null;
    colorHex?: string | null;
    minScore?: number;
    maxScore?: number;
    description?: string | null;
    displayOrder?: number;              // Schema v2
}

interface SwaggerInstrumentDto {
    instrumentID?: number;
    code?: string | null;        // e.g. "GAD7", "PHQ9"
    name?: string | null;        // e.g. "Ansiedad Generalizada"
    instrumentType?: string | null; // legacy
    questions?: SwaggerQuestionDto[] | null;
}

/** Descriptor de un instrumento dentro de un módulo, listo para mostrar al usuario. */
export interface InstrumentDescriptor {
    /** Índice posicional dentro del array `module.instruments` (usado para filtrar preguntas). */
    index: number;
    /** ID numérico del instrumento tal como lo devuelve el backend (usado en evaluation/start). */
    instrumentId?: number;
    /** Código del instrumento, ej. "GAD7", "PHQ9", "ISI", "PSS4". */
    code: string;
    /** Etiqueta amigable — viene de dimensionLabels si hay match, si no del backend. */
    label: string;
    /** Nombre original del instrumento tal como lo envía el backend. */
    backendName: string;
    /** Descripción del instrumento tal como la envía el backend. */
    backendDescription: string;
    /** Número de preguntas del instrumento. */
    questionCount: number;
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
    /** Numeric module ID — available since backend v5.1 (was already present). */
    moduleID?: number | null;
    /** Instrument code for the completed evaluation (e.g. "DASS21", "BAI").
     *  null for sub-scale instruments — infer from result.dimensionScores[].instrumentCode. */
    instrumentCode?: string | null;
    assessmentModuleName?: string | null;
    completedAt: string;
    result: SwaggerEvaluationResultDto;
}

// ── Schema v2 DTOs ──────────────────────────────────────────────────────────

/** Request para enviar una respuesta individual (Schema v2). */
interface SubmitResponseDto {
    evaluationID: number;
    questionID: number;
    selectedValue: number | null; // null para preguntas TIME/ROUTING de texto libre
    textValue: string | null;     // texto libre para preguntas TIME/ROUTING
}

/** Respuesta de evaluación ya registrada (Schema v2). */
interface EvaluationResponseDto {
    evaluationResponseID: number;
    evaluationID: number;
    questionID: number;
    questionText?: string | null;
    questionType?: QuestionType;
    selectedValue?: number | null;   // nullable desde Schema v2
    calculatedValue?: number | null; // nullable desde Schema v2
    textValue?: string | null;       // texto libre ingresado
    respondedAt: string;
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
    private readonly moduleRawCache    = new Map<AssessmentModuleId, { apiModuleId: number; moduleData: SwaggerModuleFullDto }>();

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
                this.moduleRawCache.set(moduleId, { apiModuleId, moduleData });

                return questions.map((q) => this.mapQuestion(q));
            })
        );
    }

    /**
     * Devuelve los descriptores de cada instrumento dentro de un módulo.
     * Usa la caché si ya se cargó el módulo; si no, lo carga primero.
     * El índice `index` de cada descriptor corresponde a su posición en `module.instruments`.
     */
    getModuleInstruments(moduleId: AssessmentModuleId): Observable<InstrumentDescriptor[]> {
        return this.resolveModuleRaw(moduleId).pipe(
            map(({ moduleData }) => {
                const moduleDef = getAssessmentModuleDefinition(moduleId);
                const instruments = moduleData?.instruments ?? [];
                return instruments.map((inst, i) => {
                    const dim = moduleDef.dimensionLabels[i];
                    const code = String(
                        (inst as any).code ?? (inst as any).instrumentCode ?? dim?.instrumentCode ?? ''
                    ).toUpperCase().trim() || `INST_${i}`;
                    const backendName = String((inst as any).name ?? (inst as any).instrumentName ?? '').trim();
                    const backendDescription = String((inst as any).description ?? '').trim();
                    const label = backendName || dim?.label || code;
                    const instrumentId = Number((inst as any).instrumentID ?? (inst as any).instrumentId ?? 0) || undefined;
                    const rootQuestions = (inst.questions ?? []).filter(q => q.parentQuestionID == null);
                    return { index: i, instrumentId, code, label, backendName, backendDescription, questionCount: rootQuestions.length };
                });
            })
        );
    }

    /**
     * Devuelve las preguntas de un instrumento específico dentro de un módulo.
     * Guarda el `apiModuleId` en `moduleDetailCache` para que `submit()` funcione
     * incluso cuando el usuario solo respondió ese instrumento.
     *
     * @param moduleId  ID del módulo (ej. 'mental-health')
     * @param instrumentIndex  Índice posicional del instrumento (0=GAD7, 1=PHQ9, …)
     */
    getInstrumentQuestions(moduleId: AssessmentModuleId, instrumentIndex: number): Observable<AssessmentQuestion[]> {
        return this.resolveModuleRaw(moduleId).pipe(
            map(({ apiModuleId, moduleData }) => {
                const instruments = moduleData?.instruments ?? [];
                const instrument = instruments[instrumentIndex];
                if (!instrument) {
                    throw new Error(`Instrumento índice ${instrumentIndex} no encontrado en el módulo '${moduleId}'`);
                }

                const rootQuestions = (instrument.questions ?? [])
                    .filter(q => q.parentQuestionID == null)
                    .sort((a, b) =>
                        (a.questionNumber ?? a.orderIndex ?? 0) - (b.questionNumber ?? b.orderIndex ?? 0)
                    );

                // Guarda en moduleDetailCache SOLO las preguntas de este instrumento
                // para que submit() las use correctamente al construir SubmitResponseDto[]
                this.moduleDetailCache.set(moduleId, { apiModuleId, questions: rootQuestions });

                return rootQuestions.map((q) => this.mapQuestion(q));
            })
        );
    }

    /**
     * Obtiene la data raw del módulo (con instrumentos separados).
     * Usa la caché `moduleRawCache` si ya se cargó; si no, hace el fetch completo.
     */
    private resolveModuleRaw(moduleId: AssessmentModuleId): Observable<{ apiModuleId: number; moduleData: SwaggerModuleFullDto }> {
        const cached = this.moduleRawCache.get(moduleId);
        if (cached) return of(cached);

        return this.resolveApiModuleId(moduleId).pipe(
            switchMap((apiModuleId) =>
                this.http.get<unknown>(`${this.apiUrl}/assessmentmodule/modules/${apiModuleId}/full`).pipe(
                    map((res) => {
                        const moduleData = this.unwrapObject<SwaggerModuleFullDto>(res);
                        const resolvedId = this.getModuleId(moduleData);
                        if (!resolvedId) throw new Error('No fue posible obtener el módulo');
                        // Populate both caches
                        const allQuestions = this.extractQuestions(moduleData);
                        this.moduleDetailCache.set(moduleId, { apiModuleId: resolvedId, questions: allQuestions });
                        const entry = { apiModuleId: resolvedId, moduleData };
                        this.moduleRawCache.set(moduleId, entry);
                        return entry;
                    })
                )
            )
        );
    }

    submit(moduleId: AssessmentModuleId, answers: number[]): Observable<AssessmentResult> {        // Evaluation/start requires consent accepted.
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
                // Pre-flight: block re-submission if this module is already completed.
                this.isModuleAlreadyCompleted(detail.apiModuleId).pipe(
                    switchMap((alreadyDone) =>
                        alreadyDone
                            ? throwError(() => ({
                                code: 'ALREADY_COMPLETED',
                                message: 'Este instrumento ya fue completado y no puede volver a presentarse.',
                            }))
                            : this.getInProgressEvaluation(detail.apiModuleId)
                    ),
                    switchMap((existing) => {
                        if ((existing as SwaggerEvaluationDto)?.evaluationID) {
                            return of(existing as SwaggerEvaluationDto);
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
                                }),
                                catchError((err) => {
                                    // Backend returns HTTP 409 when the module is already completed.
                                    // Normalise to the same ALREADY_COMPLETED error code the UI handles.
                                    if (err?.status === 409 || err?.error?.error?.code === 'EVALUATION_ALREADY_COMPLETED') {
                                        return throwError(() => ({
                                            code: 'ALREADY_COMPLETED',
                                            message: 'Este instrumento ya fue completado y no puede volver a presentarse.',
                                        }));
                                    }
                                    return throwError(() => err);
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

    /**
     * Submits an assessment using rich answers (supports TIME, INTEGER, ROUTING, sub-items).
     * Use this instead of submit() when the questionnaire has non-LIKERT questions.
     * @param instrumentCode  Optional: the specific instrument code being submitted (e.g. "BAI").
     *   When provided, the already-completed check is scoped to THAT instrument only.
     *   This is required for multi-instrument modules (e.g. mental-health) so that completing
     *   BAI does not block the user from later completing BDI in the same module.
     */
    submitRich(moduleId: AssessmentModuleId, richAnswers: RichAnswer[], instrumentCode?: string, instrumentId?: number): Observable<AssessmentResult> {
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
                this.isInstrumentAlreadyCompleted(detail.apiModuleId, instrumentCode).pipe(
                    switchMap((alreadyDone) =>
                        alreadyDone
                            ? throwError(() => ({
                                code: 'ALREADY_COMPLETED',
                                message: 'Este instrumento ya fue completado y no puede volver a presentarse.',
                            }))
                            : this.getInProgressEvaluation(detail.apiModuleId)
                    ),
                    switchMap((existing) => {
                        if ((existing as SwaggerEvaluationDto)?.evaluationID) return of(existing as SwaggerEvaluationDto);

                        // Build the start body — include instrumentID when available so the
                        // backend can create a per-instrument evaluation (avoids 409).
                        const startBody: Record<string, unknown> = { moduleID: detail.apiModuleId };
                        if (instrumentId && instrumentId > 0) startBody['instrumentID'] = instrumentId;

                        return this.http
                            .post<unknown>(`${this.apiUrl}/evaluation/start`, startBody)
                            .pipe(
                                map((res) => {
                                    const evaluation = this.unwrapObject<SwaggerEvaluationDto>(res);
                                    if (!evaluation?.evaluationID) throw new Error('No fue posible iniciar la evaluación');
                                    return evaluation;
                                }),
                                catchError((err) => {
                                    if (err?.status === 409 || err?.error?.error?.code === 'EVALUATION_ALREADY_COMPLETED') {
                                        return throwError(() => ({
                                            code: 'ALREADY_COMPLETED',
                                            message: 'Este instrumento ya fue completado y no puede volver a presentarse.',
                                        }));
                                    }
                                    return throwError(() => err);
                                })
                            );
                    }),
                    switchMap((evaluation) =>
                        this.submitRichResponses(evaluation.evaluationID, detail.questions, richAnswers).pipe(
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
                                    switchMap((result) =>
                                        result?.evaluationResultID ? of(result) : throwError(() => err)
                                    )
                                )
                            ),
                            map((result: SwaggerEvaluationResultDto | null) => {
                                if (!(result as SwaggerEvaluationResultDto)?.evaluationResultID) throw new Error('No fue posible completar la evaluación');
                                return result as SwaggerEvaluationResultDto;
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

    /**
     * Returns true if the user already has a completed evaluation for the given module.
     * Used as a pre-flight guard in submit() / submitRich() so each instrument can only
     * be taken once, even when local state was cleared (fresh session / page reload).
     *
     * Matching uses the numeric `moduleID` field now present in the response.
     * Falls back to keyword-matching on `assessmentModuleName` for older backend versions.
     */
    private isModuleAlreadyCompleted(apiModuleId: number): Observable<boolean> {
        if (!apiModuleId) return of(false);
        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res) ?? []),
            map((items) =>
                items.some((i) => {
                    // Primary: direct numeric moduleID comparison (backend v5.1+)
                    const mid = Number((i as any)?.moduleID ?? 0);
                    if (mid > 0) return mid === apiModuleId;
                    // Fallback: keyword-match on module name for older responses
                    return this._apiModuleIdMatchesName(apiModuleId, i?.assessmentModuleName ?? '');
                })
            ),
            catchError(() => of(false))
        );
    }

    /**
     * Returns true if the user already completed a specific instrument within a module.
     * When `instrumentCode` is provided, matches against the `instrumentCode` field on the
     * completed-evaluation DTO (backend v5.2+) and against sub-scale codes in dimensionScores.
     * When `instrumentCode` is NOT provided, falls back to module-level check.
     *
     * This is the correct guard for multi-instrument modules (e.g. mental-health) where
     * multiple instruments share the same numeric moduleID.
     */
    private isInstrumentAlreadyCompleted(apiModuleId: number, instrumentCode?: string): Observable<boolean> {
        if (!apiModuleId) return of(false);

        // No instrumentCode → fall back to module-level check (single-instrument modules)
        if (!instrumentCode) return this.isModuleAlreadyCompleted(apiModuleId);

        const upperCode = instrumentCode.toUpperCase().trim();

        return this.http.get<unknown>(`${this.apiUrl}/evaluation/my-completed`).pipe(
            map((res) => this.unwrapArray<SwaggerEvaluationWithResultDto>(res) ?? []),
            map((items) => {
                // Only look at evaluations belonging to this module
                const moduleItems = items.filter((i) => {
                    const mid = Number((i as any)?.moduleID ?? 0);
                    if (mid > 0) return mid === apiModuleId;
                    return this._apiModuleIdMatchesName(apiModuleId, i?.assessmentModuleName ?? '');
                });

                return moduleItems.some((i) => {
                    // Direct instrumentCode match (simple instruments)
                    const direct = String(i?.instrumentCode ?? '').toUpperCase().trim();
                    if (direct && (direct === upperCode || upperCode.startsWith(direct + '_') || direct.startsWith(upperCode + '_'))) {
                        return true;
                    }
                    // Sub-scale dimensionScores match (e.g. DASS21_ANXIETY → DASS21)
                    for (const dim of i?.result?.dimensionScores ?? []) {
                        const dc = String((dim as any)?.instrumentCode ?? '').toUpperCase().trim();
                        if (dc && (dc === upperCode || dc.startsWith(upperCode + '_') || upperCode.startsWith(dc + '_'))) {
                            return true;
                        }
                    }
                    return false;
                });
            }),
            catchError(() => of(false))
        );
    }

    /**
     * Fallback heuristic: resolves whether a completed-evaluation entry (identified only
     * by its human-readable module name) corresponds to a given numeric apiModuleId.
     * Used only when the backend response omits the numeric moduleID field.
     */
    private _apiModuleIdMatchesName(apiModuleId: number, moduleName: string): boolean {
        // Resolve the matching frontend moduleId from the active-modules cache,
        // then check by name keywords — same logic as AssessmentHydrationService.
        // Because modules$ is async and this helper is called inside a sync map(),
        // we cannot await it here. Instead we use the moduleRawCache which is already
        // populated by the time submitRich/submit reaches this point.
        for (const [frontendId, cached] of this.moduleRawCache.entries()) {
            if (cached.apiModuleId === apiModuleId) {
                return this._moduleNameMatchesId(moduleName, frontendId);
            }
        }
        return false;
    }

    /** Returns true when the given backend module name corresponds to a frontend moduleId. */
    private _moduleNameMatchesId(name: string, moduleId: AssessmentModuleId): boolean {
        const n = (name ?? '').toLowerCase();
        if (!n) return false;
        switch (moduleId) {
            case 'mental-health':          return n.includes('mental') || n.includes('salud');
            case 'work-fatigue':           return n.includes('fatiga') || n.includes('fatigue');
            case 'organizational-climate': return n.includes('clima') || n.includes('climate');
            case 'psychosocial-risk':      return n.includes('psicosocial');
            default:                       return false;
        }
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
        const responses: SubmitResponseDto[] = questions.map((q, index) => {
            const questionType: QuestionType = q.questionType ?? 'LIKERT';
            const rawAnswer = answers[index];

            // TIME: respuesta es texto libre (ej. "23:00") — selectedValue null
            if (questionType === 'TIME') {
                return {
                    evaluationID: evaluationId,
                    questionID: q.questionID,
                    selectedValue: null,
                    textValue: String(rawAnswer ?? ''),
                };
            }

            // INTEGER: valor numérico entero directo
            if (questionType === 'INTEGER') {
                return {
                    evaluationID: evaluationId,
                    questionID: q.questionID,
                    selectedValue: Number.isFinite(Number(rawAnswer)) ? Number(rawAnswer) : 0,
                    textValue: null,
                };
            }

            // LIKERT / ROUTING: resolver por índice de opción
            const options = this.sortOptions(q.options ?? []);
            const asNumber = Number(rawAnswer);
            let optionIndex = Number.isFinite(asNumber) ? asNumber : 0;

            if (optionIndex < 0 || optionIndex > options.length - 1) {
                const byValue = options.findIndex((o) => Number(o?.numericValue ?? o?.optionValue) === asNumber);
                optionIndex = byValue >= 0 ? byValue : 0;
            }

            optionIndex = Math.max(0, Math.min(options.length - 1, optionIndex));
            const selected = options[optionIndex] ?? options[0];
            const selectedValue = Number(selected?.numericValue ?? selected?.optionValue ?? optionIndex);

            return {
                evaluationID: evaluationId,
                questionID: q.questionID,
                selectedValue,
                textValue: null,
            };
        });

        // Schema v2: respond-multiple con soporte a textValue para preguntas TIME/ROUTING
        return this.http.post<unknown>(`${this.apiUrl}/evaluation/respond-multiple`, {
            evaluationID: evaluationId,
            responses,
        });
    }

    /**
     * Submits rich answers, properly resolving sub-items for grouped questions (ICSP_VC).
     * For each root question:
     *   - If it has subAnswers → emit one SubmitResponseDto per sub-item (by questionId)
     *   - Otherwise → emit one SubmitResponseDto for the root question
     */
    private submitRichResponses(
        evaluationId: number,
        questions: SwaggerQuestionDto[],
        richAnswers: RichAnswer[]
    ): Observable<unknown> {
        const answerMap = new Map<number, RichAnswer>(richAnswers.map((a) => [a.questionId, a]));
        const responses: SubmitResponseDto[] = [];

        for (const q of questions) {
            const rich = answerMap.get(q.questionID);
            const questionType: QuestionType = q.questionType ?? 'LIKERT';

            // Root question has sub-items → expand to individual sub-item responses
            const subItems = q.subItems ?? [];
            if (subItems.length && rich?.subAnswers?.length) {
                for (const sub of subItems) {
                    const subAns = rich.subAnswers.find((sa) => sa.questionId === sub.questionID);
                    if (!subAns) continue;
                    const subOpts = this.sortOptions(sub.options ?? []);
                    const idx = Math.max(0, Math.min(subOpts.length - 1, subAns.value ?? 0));
                    const sel = subOpts[idx] ?? subOpts[0];
                    responses.push({
                        evaluationID: evaluationId,
                        questionID: sub.questionID,
                        selectedValue: Number(sel?.numericValue ?? sel?.optionValue ?? idx),
                        textValue: null,
                    });
                }
                continue;
            }

            if (!rich) continue;

            if (questionType === 'TIME') {
                responses.push({ evaluationID: evaluationId, questionID: q.questionID, selectedValue: null, textValue: rich.text ?? '' });
                continue;
            }
            if (questionType === 'INTEGER') {
                responses.push({ evaluationID: evaluationId, questionID: q.questionID, selectedValue: rich.value ?? 0, textValue: null });
                continue;
            }
            // LIKERT / ROUTING
            const opts = this.sortOptions(q.options ?? []);
            const idx = Math.max(0, Math.min(opts.length - 1, rich.value ?? 0));
            const sel = opts[idx] ?? opts[0];
            responses.push({
                evaluationID: evaluationId,
                questionID: q.questionID,
                selectedValue: Number(sel?.numericValue ?? sel?.optionValue ?? idx),
                textValue: questionType === 'ROUTING' ? (rich.text ?? null) : null,
            });
        }

        return this.http.post<unknown>(`${this.apiUrl}/evaluation/respond-multiple`, {
            evaluationID: evaluationId,
            responses,
        });
    }

    /**
     * Maps a raw SwaggerQuestionDto to the frontend AssessmentQuestion model,
     * preserving questionType, subItemLabel, enableTextIfValue, and subItems.
     */
    private mapQuestion(q: SwaggerQuestionDto): AssessmentQuestion {
        const subItems = (q.subItems ?? [])
            .slice()
            .sort((a, b) => (a.questionNumber ?? a.orderIndex ?? 0) - (b.questionNumber ?? b.orderIndex ?? 0))
            .map((sub) => this.mapQuestion(sub));

        return {
            id: q.questionID,
            text: q.questionText ?? '',
            options: this.sortOptions(q.options ?? []).map((o) => o.optionText ?? ''),
            questionType: (q.questionType as any) ?? 'LIKERT',
            subItemLabel: q.subItemLabel ?? undefined,
            enableTextIfValue: q.enableTextIfValue ?? null,
            subItems: subItems.length ? subItems : undefined,
        };
    }

    /**
     * Extrae preguntas desde V5 (instruments -> questions) o legacy (direct questions).
     * Schema v2: devuelve solo preguntas raiz (parentQuestionID === null).
     * Los sub-items (P5a-P5j del ICSP-VC) viajan dentro de `subItems` en cada pregunta raiz.
     */
    private extractQuestions(moduleData: SwaggerModuleFullDto): SwaggerQuestionDto[] {
        let all: SwaggerQuestionDto[] = [];

        if (moduleData?.instruments?.length) {
            for (const instrument of moduleData.instruments) {
                for (const q of instrument.questions ?? []) {
                    all.push(q);
                }
            }
        } else {
            all = moduleData?.questions ?? [];
        }

        // Schema v2: filtrar solo raices (parentQuestionID === null | undefined)
        const roots = all.filter((q) => q.parentQuestionID == null);

        return roots.slice().sort((a, b) =>
            (a.questionNumber ?? a.orderIndex ?? 0) - (b.questionNumber ?? b.orderIndex ?? 0)
        );
    }
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
                score: Number(d?.score ?? 0),
                maxScore: Number(d?.maxScore ?? 0),
                riskLevel: d?.riskLevel ?? undefined,
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

