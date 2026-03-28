export type AssessmentModuleId =
    | 'mental-health'
    | 'work-fatigue'
    | 'organizational-climate'
    | 'psychosocial-risk';

export type AssessmentOutcome = 'adequate' | 'mild' | 'high-risk';

export type AssessmentQuestionType = 'LIKERT' | 'TIME' | 'INTEGER' | 'ROUTING';

export interface AssessmentQuestion {
    id: number;
    text: string;
    /** Options for LIKERT / ROUTING questions. Empty for TIME / INTEGER. */
    options: string[];
    /** Question type. Defaults to 'LIKERT' when absent. */
    questionType?: AssessmentQuestionType;
    /** Sub-label for sub-items, e.g. "a", "b" (ICSP_VC P5a-P5j) */
    subItemLabel?: string;
    /** If selectedValue equals this number, a free-text companion field appears (ROUTING). */
    enableTextIfValue?: number | null;
    /** Child questions (sub-items, e.g. ICSP_VC P5a-P5j). Rendered as a nested group. */
    subItems?: AssessmentQuestion[];
}

export interface AssessmentDimensionBreakdown {
    id: string;
    label: string;
    /** Instrument code from backend (e.g. GAD7, PHQ9, ISI, PSS4). Used for friendly label lookup. */
    instrumentCode?: string;
    /** 0-100 */
    percent: number;
    /** Raw score from backend */
    score?: number;
    /** Max possible score for this instrument */
    maxScore?: number;
    /** Risk level for this specific dimension (Green / Yellow / Red / Bajo / Moderado / Alto) */
    riskLevel?: string;
    /** Human-readable range label from backend (e.g. "Ansiedad moderada", "Sin estrés") */
    scoreRangeLabel?: string;
    /** Hex color for the bar from backend (e.g. "#FFC107", "#28A745") */
    scoreRangeColor?: string;
    /** Detailed description for this score range from backend */
    scoreRangeDescription?: string;
}

export interface AssessmentResult {
    moduleId: AssessmentModuleId;

    /** Backend evaluation identifier (optional; used for Support and tracking). */
    evaluationId?: number;

    /** Backend evaluation result identifier (optional; used for Support requests). */
    evaluationResultId?: number;

    outcome: AssessmentOutcome;
    /** Raw total score from backend (e.g. 2.67) */
    totalScore?: number;
    /** 0-100 percentage score */
    score: number;
    evaluatedAt: string; // ISO

    headline: string;
    /** Interpretation text from backend (e.g. "Tu estado en el módulo...") */
    message: string;

    dimensions: AssessmentDimensionBreakdown[];
    recommendations: AssessmentRecommendation[];
}

export interface AssessmentRecommendation {
    text: string;
    /** Short descriptive title for the recommendation. */
    title?: string;
    /** Category label from backend (e.g. "Autocuidado", "Apoyo Profesional"). */
    recommendationTypeName?: string;
    /** Dimension name paired by index with dimensionScores (e.g. "Estrés", "Ansiedad"). */
    dimensionLabel?: string;
    /** Hex color from the paired dimension's scoreRangeColor (e.g. "#DC3545"). */
    dimensionColor?: string;
    /** Instrument code this recommendation belongs to (e.g. "BDI", "DASS21"). */
    instrumentCode?: string;
}
