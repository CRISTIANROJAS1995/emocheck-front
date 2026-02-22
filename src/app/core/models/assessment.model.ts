export type AssessmentModuleId =
    | 'mental-health'
    | 'work-fatigue'
    | 'organizational-climate'
    | 'psychosocial-risk';

export type AssessmentOutcome = 'adequate' | 'mild' | 'high-risk';

export interface AssessmentQuestion {
    id: number;
    text: string;
    options: string[];
}

export interface AssessmentDimensionBreakdown {
    id: string;
    label: string;
    /** Instrument code from backend (e.g. GAD7, PHQ9, ISI, PSS4). Used for friendly label lookup. */
    instrumentCode?: string;
    /** 0-100 */
    percent: number;
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
