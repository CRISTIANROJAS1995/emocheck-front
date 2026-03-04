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
    /** Risk level for this specific dimension (Green / Yellow / Red) */
    riskLevel?: string;
}

export interface AssessmentResult {
    moduleId: AssessmentModuleId;

    /** Backend evaluation identifier (optional; used for Support and tracking). */
    evaluationId?: number;

    /** Backend evaluation result identifier (optional; used for Support requests). */
    evaluationResultId?: number;

    outcome: AssessmentOutcome;
    /** 0-100 */
    score: number;
    evaluatedAt: string; // ISO

    headline: string;
    message: string;

    dimensions: AssessmentDimensionBreakdown[];
    recommendations: string[];
}
