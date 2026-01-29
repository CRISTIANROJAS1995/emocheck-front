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
    /** 0-100 */
    percent: number;
}

export interface AssessmentResult {
    moduleId: AssessmentModuleId;
    outcome: AssessmentOutcome;
    /** 0-100 */
    score: number;
    evaluatedAt: string; // ISO

    headline: string;
    message: string;

    dimensions: AssessmentDimensionBreakdown[];
    recommendations: string[];
}
